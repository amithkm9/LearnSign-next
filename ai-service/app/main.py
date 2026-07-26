import logging
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ALLOW_ORIGINS, INTERNAL_API_TOKEN, PORT, has_openai
from .language import SUPPORTED_LANGUAGES
from .report import generate_insights
from .schemas import (
    ChatRequest,
    ChatResponse,
    RecognizeRequest,
    ReportInsightsRequest,
    TtsRequest,
    VoiceChatRequest,
    VoiceChatResponse,
)
from .tutor import process_message
from .voice import clean_for_speech, speech_to_text, text_to_speech

log = logging.getLogger(__name__)

app = FastAPI(title="LearnSign AI Service", version="1.0.0")

# The Next gateway calls this service server-to-server, so no browser origin
# needs access. CORS stays off unless CORS_ALLOW_ORIGINS is explicitly set.
if CORS_ALLOW_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ALLOW_ORIGINS,
        allow_methods=["POST"],
        allow_headers=["Content-Type", "X-Internal-Token"],
    )


def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    """Reject calls that don't carry the gateway's shared secret.

    `config` refuses to boot without INTERNAL_API_TOKEN unless ALLOW_INSECURE_LOCAL=1,
    so an empty token here means local development, never a misconfigured deploy.
    """
    if not INTERNAL_API_TOKEN:
        return
    if not x_internal_token or not secrets.compare_digest(
        x_internal_token, INTERNAL_API_TOKEN
    ):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _history(items) -> list[dict]:
    return [{"role": m.role, "content": m.content} for m in items]


@app.get("/health")
def health():
    return {"status": "healthy", "openai": has_openai()}


@app.post(
    "/tutor/chat",
    response_model=ChatResponse,
    dependencies=[Depends(require_internal_token)],
)
def tutor_chat(req: ChatRequest):
    result = process_message(
        req.message,
        req.language,
        _history(req.conversation_history),
        req.profile.model_dump() if req.profile else None,
    )
    return {
        "success": True,
        "response": result["response"],
        "language": result["language"],
    }


@app.post("/report/insights", dependencies=[Depends(require_internal_token)])
def report_insights(req: ReportInsightsRequest):
    return {"success": True, "insights": generate_insights(req.model_dump())}


@app.post("/recognize", dependencies=[Depends(require_internal_token)])
def recognize_endpoint(req: RecognizeRequest):
    try:
        from .recognition import recognize

        return recognize(req.frames)
    except Exception:
        # Never 500 the gateway — return a clean result the quiz can handle.
        # The exception detail is logged, never returned: it leaks filesystem
        # paths and library internals to the browser.
        log.exception("recognition failed")
        return {
            "detected_sign": "unknown",
            "confidence": 0,
            "message": "Recognition is temporarily unavailable.",
        }


@app.post("/voice/tts", dependencies=[Depends(require_internal_token)])
def voice_tts(req: TtsRequest):
    if not has_openai():
        raise HTTPException(
            status_code=503, detail="Voice features need OPENAI_API_KEY"
        )
    return {
        "success": True,
        "audio": text_to_speech(req.text, req.voice),
        "format": "mp3",
    }


@app.post(
    "/voice/chat",
    response_model=VoiceChatResponse,
    dependencies=[Depends(require_internal_token)],
)
def voice_chat(req: VoiceChatRequest):
    if not has_openai():
        raise HTTPException(
            status_code=503, detail="Voice features need OPENAI_API_KEY"
        )

    hint = req.language if req.language in SUPPORTED_LANGUAGES else "en"
    message = speech_to_text(req.audio, hint)
    if not message:
        return {
            "success": True,
            "transcription": "",
            "response": {
                "type": "error",
                "response": "I couldn't hear that. Please try again.",
            },
            "audio": None,
            "language": hint,
        }

    result = process_message(
        message,
        req.language,
        _history(req.conversation_history),
        req.profile.model_dump() if req.profile else None,
    )

    audio = None
    if req.voice_enabled and result["text_for_speech"]:
        try:
            audio = text_to_speech(clean_for_speech(result["text_for_speech"]))
        except Exception:
            audio = None

    return {
        "success": True,
        "transcription": message,
        "response": result["response"],
        "audio": audio,
        "language": result["language"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT)
