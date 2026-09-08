# Multi-stage container for KisanLink AI Microservice
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Pillow and network utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy microservice code
COPY . ./

# Create non-root user for security
RUN groupadd -r kisanlink && useradd -r -g kisanlink kisanlink
USER kisanlink:kisanlink

EXPOSE 8000

ENV PORT=8000
ENV CORS_ORIGINS="http://localhost,http://localhost:80,http://localhost:3000,http://localhost:5173"

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
