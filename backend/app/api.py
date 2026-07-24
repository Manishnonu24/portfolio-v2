"""
api.py — FastAPI router for the AI SQL Chatbot.

Handles POST /api/chat with robust error recovery so the chat UI always
receives a friendly 200 OK assistant response instead of 422 or 500 errors.
"""
import logging
import traceback

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from .services.sql_generator import generate_sql, format_answer
from .services.sql_validator import validate_sql
from .services.query_executor import execute_query
from .conversation import get_history, add_message, clear_history
from .database import get_db_schema, test_connection

router = APIRouter()
logger = logging.getLogger(__name__)


# ── POST /api/chat ─────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(payload: dict):
    """
    Main chat endpoint — called by the frontend Chatbot component.

    Request body:
        { "question": "Show all employees in Delhi", "user": "web-visitor" }

    Response:
        {
          "answer":         "There are 7 employees located in Delhi...",
          "sql":            "SELECT * FROM employees WHERE LOWER(city) = 'delhi';",
          "rows":           7,
          "execution_time": 0.0069,
          "source":         "database"
        }
    """
    user = payload.get("user", "anonymous")
    question = (payload.get("question") or "").strip()

    if not question:
        return JSONResponse(
            status_code=400,
            content={"detail": "Missing 'question' in request body."}
        )

    logger.info(f"[{user}] Question: {question!r}")

    # Check for simple greetings first
    lower_q = question.lower().strip("?!. ")
    if lower_q in ("hi", "hello", "hey", "hola", "help", "who are you", "what can you do"):
        answer = (
            "Hi! 👋 I'm Manish's AI Assistant. Ask me anything about Manish's skills, experience at DIFM & HashedBit, projects (MentorAI, AutoLink, Ninagashi), or education!\n\n"
            "Here are some example questions you can ask:\n"
            "- *'What are Manish's core technical skills?'*\n"
            "- *'Tell me about Manish's work experience at DIFM & HashedBit'*\n"
            "- *'What projects has Manish built (MentorAI, AutoLink, Ninagashi)?'*\n"
            "- *'What is Manish's education and CGPA at AKGEC?'*\n"
            "- *'How many LeetCode problems has Manish solved?'*"
        )
        add_message(user, "user", question)
        add_message(user, "assistant", answer)
        return JSONResponse(content={
            "answer": answer,
            "sql": None,
            "rows": 0,
            "execution_time": 0,
            "source": "greeting",
        })

    try:
        # ── Step 1: Retrieve conversation history for context ──────────────
        history = get_history(user)

        # ── Step 2: Generate SQL from the question ─────────────────────────
        sql = generate_sql(question, history)
        logger.info(f"[{user}] Generated SQL: {sql!r}")

        # ── Step 3: Validate — block anything that is not SELECT ───────────
        is_valid, validation_error = validate_sql(sql)

        if not is_valid:
            if validation_error == "CANNOT_ANSWER":
                answer = (
                    "I'm sorry, I couldn't map your question to the available database tables. "
                    "Could you try rephrasing? You can ask about **employees**, **departments**, or **sales** data."
                )
            else:
                logger.warning(f"[{user}] Query validation issue: {sql!r} — {validation_error}")
                answer = (
                    "I am configured as a read-only SQL assistant and can only run `SELECT` queries. "
                    "Please ask a question to view or query data from our database!"
                )
            add_message(user, "user", question)
            add_message(user, "assistant", answer)
            return JSONResponse(content={
                "answer": answer,
                "sql": sql if is_valid else None,
                "rows": 0,
                "execution_time": 0,
                "source": "fallback",
            })

        # ── Step 4: Execute the validated query ────────────────────────────
        try:
            results, exec_time = execute_query(sql)
            logger.info(f"[{user}] Executed successfully: {len(results)} rows in {exec_time:.3f}s")
        except Exception as query_err:
            logger.warning(f"[{user}] Query execution error: {query_err}")
            answer = (
                "I generated a database query, but encountered an issue retrieving the records. "
                "Please try rephrasing your question (e.g. *'Show employees from Mumbai'*)."
            )
            add_message(user, "user", question)
            add_message(user, "assistant", answer)
            return JSONResponse(content={
                "answer": answer,
                "sql": sql,
                "rows": 0,
                "execution_time": 0,
                "source": "error",
            })

        # ── Step 5: Format results into a natural language answer ──────────
        answer = format_answer(question, sql, results, history)

        # ── Step 6: Update conversation memory ────────────────────────────
        add_message(user, "user", question)
        add_message(user, "assistant", answer)

        return JSONResponse(content={
            "answer": answer,
            "sql": sql,
            "rows": len(results),
            "execution_time": round(exec_time, 4),
            "source": "database",
        })

    except Exception as e:
        traceback.print_exc()
        logger.error(f"[{user}] Unhandled error: {e}")
        fallback_answer = (
            "An error occurred while processing your request. "
            "Please check that the server has a valid API key configured."
        )
        return JSONResponse(
            status_code=200,
            content={
                "answer": fallback_answer,
                "sql": None,
                "rows": 0,
                "execution_time": 0,
                "source": "error",
            }
        )


# ── GET /api/schema ────────────────────────────────────────────────────────

@router.get("/schema")
async def schema():
    """Return the current database schema as a string."""
    try:
        schema_str = get_db_schema()
        return JSONResponse(content={"schema": schema_str})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/history ───────────────────────────────────────────────────────

@router.get("/history")
async def get_conversation_history(user: str = "anonymous"):
    """Return conversation history for the given user."""
    return JSONResponse(content={
        "user": user,
        "history": get_history(user),
    })


# ── DELETE /api/history ────────────────────────────────────────────────────

@router.delete("/history")
async def delete_conversation_history(user: str = "anonymous"):
    """Clear conversation history for the given user."""
    clear_history(user)
    return JSONResponse(content={
        "status": "cleared",
        "user": user,
    })


# ── GET /api/health-db ─────────────────────────────────────────────────────

@router.get("/health-db")
async def health_db():
    """Check database connectivity."""
    connected = test_connection()
    return JSONResponse(
        status_code=200 if connected else 503,
        content={
            "database": "connected" if connected else "disconnected",
            "status": "ok" if connected else "error",
        },
    )
