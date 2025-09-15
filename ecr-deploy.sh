#!/bin/bash

# ECR Deployment Script - To be used on EC2 instance
# This script pulls the latest images from ECR and restarts the services

set -e

echo "🔄 Starting ECR deployment update..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[ECR-DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set ECR repository URIs (these should be set by GitHub Actions or environment)
BACKEND_ECR_REPO=${BACKEND_IMAGE:-"your-account.dkr.ecr.ap-south-1.amazonaws.com/cogniflow-backend:latest"}
FRONTEND_ECR_REPO=${FRONTEND_IMAGE:-"your-account.dkr.ecr.ap-south-1.amazonaws.com/cogniflow-frontend:latest"}

print_status "Backend Image: $BACKEND_ECR_REPO"
print_status "Frontend Image: $FRONTEND_ECR_REPO"

# Extract ECR region from the URI
ECR_REGION=$(echo $BACKEND_ECR_REPO | cut -d'.' -f4)
ECR_REGISTRY=$(echo $BACKEND_ECR_REPO | cut -d'/' -f1)

print_status "ECR Region: $ECR_REGION"
print_status "ECR Registry: $ECR_REGISTRY"

# Login to ECR
print_status "Logging into ECR..."
aws ecr get-login-password --region $ECR_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest images
print_status "Pulling latest backend image..."
docker pull $BACKEND_ECR_REPO

print_status "Pulling latest frontend image..."
docker pull $FRONTEND_ECR_REPO

# Stop current containers
print_status "Stopping current containers..."
docker-compose -f docker-compose.prod.yml down

# Clean up old images
print_status "Cleaning up old images..."
docker image prune -f

# Set environment variables for docker-compose
export BACKEND_IMAGE=$BACKEND_ECR_REPO
export FRONTEND_IMAGE=$FRONTEND_ECR_REPO

# Start containers with new images
print_status "Starting containers with updated images..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Verify deployment
print_status "Verifying deployment..."
docker-compose -f docker-compose.prod.yml ps

# Health checks
print_status "Running health checks..."
if curl -f -s http://localhost:8080/api/open/health > /dev/null 2>&1; then
    print_success "✅ Backend health check passed"
else
    print_warning "⚠️ Backend health check failed"
fi

if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "✅ Frontend health check passed"
else
    print_warning "⚠️ Frontend health check failed"
fi

print_success "🎉 ECR deployment update completed!"
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 View logs with:"
echo "docker-compose -f docker-compose.prod.yml logs -f"