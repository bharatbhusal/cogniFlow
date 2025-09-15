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

# Smart migration handling
log "Handling database migrations..."

# Check current database state
log "Checking database migration state..."
DB_CURRENT=$(alembic current 2>/dev/null | grep -o '[a-f0-9]\{12\}' | head -n1 || echo "")
AVAILABLE_REVISIONS=$(alembic history --verbose 2>/dev/null | grep -o '[a-f0-9]\{12\}' || echo "")

if [ -z "$DB_CURRENT" ]; then
    log "No current revision found in database"
    
    # Check if database has tables (is initialized)
    TABLES_COUNT=$(python -c "
import asyncio
from app.config.db import get_async_session
from sqlalchemy import text

async def check_tables():
    async with get_async_session() as session:
        result = await session.execute(text(\"SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'\"))
        return result.scalar()

print(asyncio.run(check_tables()))
" 2>/dev/null || echo "0")
    
    if [ "$TABLES_COUNT" -gt 0 ]; then
        log "Database has existing tables but no alembic version"
        log "Stamping database with latest migration..."
        LATEST_REV=$(echo "$AVAILABLE_REVISIONS" | head -n1)
        if [ -n "$LATEST_REV" ]; then
            alembic stamp "$LATEST_REV"
            log "✓ Database stamped with revision: $LATEST_REV"
        else
            log "No available revisions found, stamping as head"
            alembic stamp head
        fi
    else
        log "Fresh database detected, running initial migration"
        if alembic upgrade head; then
            log "✓ Initial migration completed successfully"
        else
            error "Initial migration failed"
            exit 1
        fi
    fi
else
    log "Current database revision: $DB_CURRENT"
    
    # Check if current revision exists in available revisions
    if echo "$AVAILABLE_REVISIONS" | grep -q "$DB_CURRENT"; then
        log "Current revision found in available migrations"
        if alembic upgrade head; then
            log "✓ Database migrations completed successfully"
        else
            error "Database migration failed"
            exit 1
        fi
    else
        warn "Current database revision ($DB_CURRENT) not found in available migrations"
        log "Available revisions: $AVAILABLE_REVISIONS"
        
        # Try to find a compatible revision or reset
        log "Attempting to find compatible migration path..."
        if alembic upgrade head 2>/dev/null; then
            log "✓ Migration completed successfully despite revision mismatch"
        else
            warn "Migration failed, attempting to stamp with latest available revision"
            LATEST_REV=$(echo "$AVAILABLE_REVISIONS" | head -n1)
            if [ -n "$LATEST_REV" ]; then
                alembic stamp "$LATEST_REV"
                alembic upgrade head
                log "✓ Database re-stamped and migrated"
            else
                error "Could not resolve migration conflict"
                exit 1
            fi
        fi
    fi
fi

# Auto-generate new migrations if model changes detected
log "Checking for schema changes..."
if alembic check 2>/dev/null; then
    log "No pending schema changes detected"
else
    log "Schema changes detected, generating migration..."
    if alembic revision --autogenerate -m "Auto migration $(date '+%Y%m%d_%H%M%S')" 2>/dev/null; then
        log "New migration created, applying..."
        alembic upgrade head
        log "✓ New migrations applied"
    else
        log "No new migrations needed or generation failed"
    fi
fi

log "Database setup complete!"
log "Starting FastAPI application..."

# Execute the main command
exec "$@"