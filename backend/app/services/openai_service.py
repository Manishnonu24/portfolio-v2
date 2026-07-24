"""
openai_service.py — Multi-provider AI wrapper supporting OpenAI & Google Gemini.

Automatically detects whether the key in backend/.env is:
  - An OpenAI API key (starts with "sk-")
  - A Google Gemini API key (starts with "AQ." or "AIza")

Both providers use the unified function `chat_completion(messages)`.
"""
import os
import logging
from typing import List, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────
OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "models/gemma-4-26b-a4b-it")

_openai_client = None
_is_gemini: bool = False


def _init_provider() -> None:
    """Detect and initialize the appropriate AI client (OpenAI vs Gemini)."""
    global _openai_client, _is_gemini

    key = OPENAI_API_KEY.strip()

    if not key or key == "sk-your-openai-api-key-here":
        raise ValueError(
            "API key is missing in backend/.env. "
            "Please set OPENAI_API_KEY or GEMINI_API_KEY in backend/.env."
        )

    # Detect key format
    if key.startswith("AQ.") or key.startswith("AIza") or "gemini" in OPENAI_MODEL.lower():
        _is_gemini = True
        import google.generativeai as genai
        genai.configure(api_key=key)
        logger.info("[AI Service] Configured Google Gemini provider.")
    else:
        _is_gemini = False
        from openai import OpenAI
        _openai_client = OpenAI(api_key=key)
        logger.info(f"[AI Service] Configured OpenAI provider using {OPENAI_MODEL}.")


def chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.0,
    max_tokens: int = 1000,
) -> str:
    """
    Call the AI provider (OpenAI or Gemini) with a standard list of chat messages.

    Args:
        messages:    List of {"role": "system"|"user"|"assistant", "content": "..."}
        temperature: 0.0 = deterministic (best for SQL), 0.3-0.7 = creative
        max_tokens:  Maximum tokens in response

    Returns:
        The response text (stripped).
    """
    global _openai_client, _is_gemini

    if _openai_client is None and not _is_gemini:
        _init_provider()

    if _is_gemini:
        return _call_gemini(messages, temperature=temperature, max_tokens=max_tokens)
    else:
        return _call_openai(messages, temperature=temperature, max_tokens=max_tokens)


def _call_openai(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> str:
    from openai import OpenAIError
    try:
        response = _openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content or ""
        return content.strip()
    except OpenAIError as e:
        logger.error(f"[OpenAI] API error: {e}")
        raise


def _call_gemini(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> str:
    import google.generativeai as genai

    system_text = ""
    prompt_parts = []

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            system_text = content
        elif role == "assistant":
            prompt_parts.append(f"ASSISTANT: {content}")
        else:
            prompt_parts.append(f"USER: {content}")

    full_prompt = (system_text + "\n\n" + "\n\n".join(prompt_parts)).strip()

    try:
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        )
        response = model.generate_content(full_prompt)
        text = response.text or ""
        return text.strip()
    except Exception as e:
        logger.error(f"[Gemini] API error: {e}")
        raise
