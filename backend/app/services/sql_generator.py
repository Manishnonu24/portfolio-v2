"""
sql_generator.py — Text-to-SQL generation and natural language answer formatting.

Two responsibilities:
  1. generate_sql()   — Turn a user question + conversation history into a SQL query.
  2. format_answer()  — Turn SQL results into a clear natural language response.
"""
import re
import logging
from typing import Any, Dict, List

from ..database import get_db_schema
from .openai_service import chat_completion

logger = logging.getLogger(__name__)

# ── SQL Generation Prompt ──────────────────────────────────────────────────

SQL_SYSTEM_PROMPT = """\
You are a precise SQL expert assistant. Your ONLY job is to write a single, \
correct MySQL SELECT query that answers the user's question.

=== STRICT RULES ===
1. Output ONLY the raw SQL query — no markdown code fences, no backticks, \
   no explanation, no comments, nothing else.
2. ONLY use SELECT statements. NEVER generate UPDATE, DELETE, INSERT, DROP, \
   ALTER, TRUNCATE, CREATE, GRANT, REVOKE, EXEC, or any other statement.
3. If the question cannot be answered from the available schema, output \
   exactly the single word: CANNOT_ANSWER
4. Use MySQL-compatible syntax.
5. Default to LIMIT 100 unless the user asks for a different limit or asks \
   for all records.
6. Use table aliases and clear column aliases for readability.
7. Match string values case-insensitively using LOWER() or LIKE where \
   appropriate.
8. Join tables when needed — use the foreign keys shown in the schema.

=== DATABASE SCHEMA ===
{schema}
"""

# ── Answer Formatting Prompt ───────────────────────────────────────────────

ANSWER_SYSTEM_PROMPT = """\
You are a helpful data analyst for Konnect. Given a user's question and the MySQL query \
results, write a clean, friendly, direct natural-language answer.

CRITICAL MANDATORY RULE:
Output ONLY your final answer for the user.
Do NOT include any internal thoughts, reasoning steps, planning, scratchpad notes, or self-corrections \
(e.g., NEVER write "* SQL Query:", "* Results:", "* Context:", "* Formatting:", "* Draft:", "* Wait,").
Start IMMEDIATELY with the final answer sentence or markdown table.

Guidelines:
- Answer directly and concisely.
- Use a clean markdown table when returning multiple records.
- Format currency using ₹ (e.g., ₹1,80,000).
- Be professional, polite, and clear.
"""


# ── Public API ─────────────────────────────────────────────────────────────

def generate_sql(question: str, conversation_history: List[Dict[str, str]]) -> str:
    """
    Generate a MySQL SELECT query for the given question.

    Args:
        question:             The user's natural language question.
        conversation_history: Previous conversation turns for follow-up context.

    Returns:
        A SQL query string, or 'CANNOT_ANSWER' if the question is out of scope.
    """
    schema = get_db_schema()
    system_content = SQL_SYSTEM_PROMPT.format(schema=schema)

    # Build message list: system + last 3 history pairs + current question
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_content}
    ]

    # Include up to 6 history messages (3 Q+A pairs) for follow-up context
    for msg in conversation_history[-6:]:
        messages.append(msg)

    messages.append({"role": "user", "content": question})

    raw = chat_completion(messages, temperature=0.0, max_tokens=600)

    # Strip any accidental markdown fences the model might add
    cleaned = _strip_markdown_fences(raw)

    logger.info(f"Generated SQL: {cleaned}")
    return cleaned


def format_answer(
    question: str,
    sql: str,
    results: List[Dict[str, Any]],
    conversation_history: List[Dict[str, str]],
) -> str:
    """
    Convert raw SQL results into a natural language answer using GPT/Gemini.

    Args:
        question:             The original user question.
        sql:                  The SQL query that was executed.
        results:              List of row dicts returned by the database.
        conversation_history: Previous conversation turns for context.

    Returns:
        A markdown-formatted natural language answer.
    """
    if not results:
        return (
            "The query ran successfully but returned **no results**. "
            "This could mean the data doesn't exist or the filters didn't match any records."
        )

    result_text = _format_results_for_prompt(results)
    row_count = len(results)

    user_content = (
        f"User question: {question}\n\n"
        f"SQL executed: {sql}\n\n"
        f"Total rows returned: {row_count}\n\n"
        f"Results:\n{result_text}\n\n"
        f"Remember: Output ONLY the final answer text/table for the user. Do NOT write any reasoning notes or scratchpad headers."
    )

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": ANSWER_SYSTEM_PROMPT},
        *conversation_history[-4:],   # last 2 Q+A pairs for context
        {"role": "user", "content": user_content},
    ]

    raw_answer = chat_completion(messages, temperature=0.2, max_tokens=700)
    return _clean_formatted_answer(raw_answer)


def _clean_formatted_answer(text: str) -> str:
    """Strip any LLM reasoning / scratchpad lines before returning to user."""
    if not text:
        return ""

    lines = text.splitlines()
    reasoning_keywords = (
        "sql query:", "results:", "context:", "formatting:", "markdown table:",
        "wait,", "draft", "total ", "columns to", "since i", "self-correction",
        "plan:", "formatting salaries:", "intro:"
    )

    clean_lines = []
    found_answer = False

    for line in lines:
        s = line.strip().lower()
        is_reasoning = any(
            s.startswith("* " + kw) or s.startswith("*" + kw) or s.startswith("- " + kw) or s.startswith(kw)
            for kw in reasoning_keywords
        )

        if not found_answer:
            if line.strip().startswith("|") or (line.strip() and not is_reasoning and not (line.strip().startswith("* ") and ":" in line)):
                found_answer = True
                clean_lines.append(line)
        else:
            if is_reasoning and ("wait" in s or "since" in s or "prompt" in s or "formatting" in s or "180000" in s or "draft" in s):
                continue
            clean_lines.append(line)

    if clean_lines:
        return "\n".join(clean_lines).strip()
    return text.strip()


# ── Helpers ────────────────────────────────────────────────────────────────

def _strip_markdown_fences(text: str) -> str:
    """Extract clean raw SELECT query from model output."""
    if not text:
        return ""
    stripped = text.strip()
    if stripped.upper() == "CANNOT_ANSWER":
        return "CANNOT_ANSWER"

    # 1. Look for ```sql ... ``` code block first
    code_block = re.search(r"```(?:sql)?\s*(SELECT\s+[\s\S]+?\bFROM\b[\s\S]+?)(?:```|$)", stripped, re.IGNORECASE)
    if code_block:
        sql = code_block.group(1).strip()
        if not sql.endswith(";"):
            sql += ";"
        return sql

    # 2. Scan lines from bottom to top for a line starting with SELECT and containing FROM
    lines = [line.strip("` \t\r") for line in stripped.splitlines() if line.strip("` \t\r")]
    for line in reversed(lines):
        if line.upper().startswith("SELECT") and "FROM" in line.upper():
            sql = line.strip()
            if not sql.endswith(";"):
                sql += ";"
            return sql

    # 3. Search for any SELECT ... FROM ... pattern
    match = re.search(r"\b(SELECT\s+[\*\w\s,`.\(\)]+\s+FROM\b[\s\S]+?)(?:;|\Z)", stripped, re.IGNORECASE)
    if match:
        sql = match.group(1).strip()
        if not sql.endswith(";"):
            sql += ";"
        return sql

    return stripped


def _format_results_for_prompt(results: List[Dict[str, Any]]) -> str:
    """
    Serialize database rows for inclusion in the GPT prompt.
    Shows up to 20 rows in full; summarises the rest.
    """
    if not results:
        return "(empty result set)"

    max_show = 20
    lines: List[str] = []

    for row in results[:max_show]:
        lines.append(str(row))

    if len(results) > max_show:
        lines.append(
            f"\n[Showing {max_show} of {len(results)} rows. "
            f"{len(results) - max_show} additional rows not shown.]"
        )

    return "\n".join(lines)
