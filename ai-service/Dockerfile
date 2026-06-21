FROM python:3.11-slim

# System libraries required by OpenCV + MediaPipe (sign recognition). Without
# these the cv2/mediapipe import fails at runtime with "libGL.so.1: cannot open".
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8100

# Honour the platform-injected $PORT (Render/Fly), default 8100 locally. Shell
# form so the env var is expanded at runtime.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8100}
