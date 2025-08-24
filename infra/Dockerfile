# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps needed for building some wheels (cryptography, httptools, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libffi-dev libssl-dev \
 && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

EXPOSE 8080
CMD ["uvicorn","apps.api.main:app","--host","0.0.0.0","--port","8080"]