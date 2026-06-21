import base64
import re

from .llm import get_openai_client

# Emoji + markdown stripping for cleaner TTS input.
_EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF\U00002700-\U000027BF]",
    flags=re.UNICODE,
)


def speech_to_text(audio_b64: str, language: str = "en") -> str:
    audio_bytes = base64.b64decode(audio_b64)
    transcription = get_openai_client().audio.transcriptions.create(
        model="whisper-1",
        file=("audio.webm", audio_bytes, "audio/webm"),
        language=language,
    )
    return (transcription.text or "").strip()


def text_to_speech(text: str, voice: str = "nova") -> str:
    resp = get_openai_client().audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text[:4000],
        response_format="mp3",
    )
    audio_bytes = resp.content if hasattr(resp, "content") else resp.read()
    return base64.b64encode(audio_bytes).decode()


def clean_for_speech(text: str) -> str:
    text = re.sub(r"[*_`#]", "", text)
    text = re.sub(r"\[.*?\]", "", text)
    text = _EMOJI.sub("", text)
    return text[:1000]
