from typing import Any, Dict, List, Mapping, Optional

# Minimal type stubs for Pylance to recognize `openai` usage in this project.
api_key: Optional[str]

class Embedding:
    @staticmethod
    def create(*, model: str, input: Any) -> Dict[str, Any]:
        ...

class ChatCompletion:
    @staticmethod
    def create(*, model: str, messages: List[Mapping[str, Any]], max_tokens: int = ...) -> Dict[str, Any]:
        ...

__all__ = ["api_key", "Embedding", "ChatCompletion"]
