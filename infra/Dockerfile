# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for wheels (cryptography/uvloop, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8080

# 2 workers is a good default for small instances; tune later
CMD ["gunicorn", "apps.api.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8080", "--workers", "2", "--timeout", "90"]