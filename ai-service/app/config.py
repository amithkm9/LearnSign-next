import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("AI_SERVICE_PORT", os.getenv("PORT", "8100")))

# Shared secret the Next gateway must send on every request.
#
# This service is deployed to a PUBLIC host (Hugging Face Space), so a missing
# token would expose the OpenAI-backed endpoints to the whole internet. Boot
# fails closed rather than silently serving unauthenticated traffic; local dev
# opts out explicitly with ALLOW_INSECURE_LOCAL=1.
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")
ALLOW_INSECURE_LOCAL = os.getenv("ALLOW_INSECURE_LOCAL") == "1"

if not INTERNAL_API_TOKEN and not ALLOW_INSECURE_LOCAL:
    raise RuntimeError(
        "INTERNAL_API_TOKEN is not set. Generate one with `openssl rand -hex 32` and "
        "set it on both this service and the Next gateway. For local development "
        "only, set ALLOW_INSECURE_LOCAL=1 to run without authentication."
    )

# Browsers never call this service directly — the Next gateway proxies server-side.
# Any origin listed here is allowed for CORS; empty (the default) disables it.
CORS_ALLOW_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if o.strip()
]


def has_openai() -> bool:
    return bool(OPENAI_API_KEY)
