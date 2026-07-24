"""
conversation.py — In-memory, per-user conversation history.

Keeps the last N messages per user so the AI has context for
follow-up questions like:
  "Show all employees" → "Only those from Mumbai" → "Who earns most?"
"""
from collections import defaultdict
from typing import Dict, List

# Max number of individual messages stored per user
# 10 messages = 5 question/answer pairs of context
MAX_MESSAGES = 10

# Storage: { user_id: [ {"role": "user"|"assistant", "content": "..."} ] }
_store: Dict[str, List[dict]] = defaultdict(list)


def get_history(user: str) -> List[dict]:
    """Return the full conversation history for a user."""
    return list(_store[user])


def add_message(user: str, role: str, content: str) -> None:
    """
    Append a message to the user's history.
    Automatically trims to MAX_MESSAGES.
    """
    _store[user].append({"role": role, "content": content})
    # Keep only the most recent messages
    if len(_store[user]) > MAX_MESSAGES:
        _store[user] = _store[user][-MAX_MESSAGES:]


def clear_history(user: str) -> None:
    """Wipe all history for a user (e.g., on new session)."""
    _store[user] = []


def clear_all() -> None:
    """Wipe all conversation history for all users."""
    _store.clear()


def get_all_users() -> List[str]:
    """Return list of all users who have conversation history."""
    return list(_store.keys())


def user_message_count(user: str) -> int:
    """Return how many messages are stored for a user."""
    return len(_store[user])
