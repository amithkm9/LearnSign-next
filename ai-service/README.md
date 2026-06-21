# LearnSign AI Service (Python / FastAPI)

The **AI brain** for LearnSign. Owns the tutor chatbot and voice. Stateless:
it never touches the database or auth — the **Next app** verifies the user,
gathers their context from the DB, and passes it in each request.

```
Browser → Next (auth + DB context) → THIS service (OpenAI + sign logic) → back
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/health` | liveness + whether OpenAI is configured |
| POST | `/tutor/chat` | text chat → tutor response (+ sign-video sequence) |
| POST | `/voice/chat` | audio → Whisper → tutor → optional TTS reply |
| POST | `/voice/tts` | text → speech (base64 mp3) |
| POST | `/report/insights` | parent-report AI narrative from stats |
| POST | `/recognize` | webcam frames → sign (TensorFlow + MediaPipe) |

> **Recognition deps are heavy** (TensorFlow + MediaPipe + OpenCV) and require
> **Python ≤ 3.12**. They're lazy-loaded on the first `/recognize` call, so chat
> and voice stay fast. Versions are pinned in `requirements.txt` for
> tensorflow/mediapipe/protobuf compatibility — don't bump blindly. The model
> lives in `app/models/sign_language_numbers_letters.h5` (classes: a/b/c, 1/2/3).
> This replaces the standalone `sign_recognition/` service.

The sign-video **files** are served by Next from `/assets/videos/signs/…`;
this service only returns those paths (via `app/data/signs_manifest.json`).
The dictionaries + system prompt in `app/data/` are generated from the Next
TS sources.

## Run locally

```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add OPENAI_API_KEY for chat/voice
python -m app.main            # http://localhost:8100
```

The direct sign-video path (e.g. asking for "hello") works **without** OpenAI;
general questions and voice need `OPENAI_API_KEY`.

## Docker

```bash
docker build -t learnsign-ai .
docker run -p 8100:8100 --env-file .env learnsign-ai
```
