#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

log "Starting CogniFlow Backend..."

# Wait for database to be ready
log "Waiting for database connection..."
max_tries=10
tries=0

until python -c "
import asyncio
import sys
from app.config.db import check_db_connection

async def check():
    try:
        result = await check_db_connection()
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f'Connection failed: {e}')
        sys.exit(1)

asyncio.run(check())
" 2>/dev/null; do
    tries=$((tries + 1))
    if [ $tries -ge $max_tries ]; then
        error "Database is still unavailable after $max_tries attempts"
        exit 1
    fi
    warn "Database is unavailable - sleeping (attempt $tries/$max_tries)"
    sleep 2
done

log "Database connection established!"

# Run migrations
log "Running database migrations..."
if alembic upgrade head; then
    log "✓ Database migrations completed successfully"
else
    error "Database migration failed"
    exit 1
fi

# Check for new migrations
log "Checking for schema changes..."
if alembic revision --autogenerate -m "Auto migration $(date '+%Y%m%d_%H%M%S')" 2>/dev/null; then
    log "New migration created, applying..."
    alembic upgrade head
    log "✓ New migrations applied"
else
    log "No new migrations needed"
fi

log "Database setup complete!"
log "Starting FastAPI application..."

# Execute the main command
exec "$@"