FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install CLI dependencies (from root requirements.txt)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install backend dependencies (from backend/requirements.txt)
COPY backend/requirements.txt ./backend_requirements.txt
RUN pip install --no-cache-dir -r backend_requirements.txt

# Copy source directories
COPY backend/ ./backend/
COPY cli/ ./cli/

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
