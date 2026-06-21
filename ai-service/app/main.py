from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import PORT, has_openai
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

app = FastAPI(title="LearnSign AI Service", version="1.0.0")

# Called only by the Next gateway (same machine / internal network).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _history(items) -> list[dict]:
    return [{"role": m.role, "content": m.content} for m in items]


@app.get("/health")
def health():
    return {"status": "healthy", "openai": has_openai()}


@app.post("/tutor/chat", response_model=ChatResponse)
def tutor_chat(req: ChatRequest):
    result = process_message(
        req.message,
        req.language,
        _history(req.conversation_history),
        req.profile.model_dump() if req.profile else None,
    )
    return {"success": True, "response": result["response"], "language": result["language"]}


@app.post("/report/insights")
def report_insights(req: ReportInsightsRequest):
    return {"success": True, "insights": generate_insights(req.model_dump())}


@app.post("/recognize")
def recognize_endpoint(req: RecognizeRequest):
    from .recognition import recognize

    return recognize(req.frames)


@app.post("/voice/tts")
def voice_tts(req: TtsRequest):
    if not has_openai():
        raise HTTPException(status_code=503, detail="Voice features need OPENAI_API_KEY")
    return {"success": True, "audio": text_to_speech(req.text, req.voice), "format": "mp3"}


@app.post("/voice/chat", response_model=VoiceChatResponse)
def voice_chat(req: VoiceChatRequest):
    if not has_openai():
        raise HTTPException(status_code=503, detail="Voice features need OPENAI_API_KEY")

    hint = req.language if req.language in SUPPORTED_LANGUAGES else "en"
    message = speech_to_text(req.audio, hint)
    if not message:
        return {
            "success": True,
            "transcription": "",
            "response": {"type": "error", "response": "I couldn't hear that. Please try again."},
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
