FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8100

# Honour the platform-injected $PORT (Render/Fly), default 8100 locally. Shell
# form so the env var is expanded at runtime.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8100}
