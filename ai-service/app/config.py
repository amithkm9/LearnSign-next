import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("AI_SERVICE_PORT", "8100"))


def has_openai() -> bool:
    return bool(OPENAI_API_KEY)
