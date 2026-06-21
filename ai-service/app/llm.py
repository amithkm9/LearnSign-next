"""Shared OpenAI helpers — one lazy client + JSON-fence stripping for the whole app."""
import re

from .config import OPENAI_API_KEY, has_openai

_client = None


def get_openai_client():
    """Lazy singleton OpenAI client; returns None when no key is configured."""
    global _client
    if _client is None and has_openai():
        from openai import OpenAI

        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def strip_code_fence(text: str) -> str:
    """Remove a ```lang ... ``` wrapper some models add around JSON output."""
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text, flags=re.I)
        text = re.sub(r"\n?```$", "", text).strip()
    return text
