FROM python:3.9.22-slim

# Set working directory
WORKDIR /app

# Install build tools and required system packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libssl-dev \
    libffi-dev \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy source files
COPY . .

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Run FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]