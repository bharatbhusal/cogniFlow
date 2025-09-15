#!/bin/bash

# Quick Deploy Script for CogniFlow on AWS EC2 (ECR-based)
# This script sets up ECR-based deployment for CogniFlow

set -e

echo "🚀 CogniFlow ECR-based Quick Deploy Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Get user input
read -p "Enter your AWS ECR repository URI (backend): " BACKEND_ECR_URI
read -p "Enter your AWS ECR repository URI (frontend): " FRONTEND_ECR_URI
read -p "Enter your email for SSL certificate: " EMAIL

if [[ -z "$EMAIL" ]]; then
    print_error "Email is required for SSL certificate generation"
    exit 1
fi

if [[ -z "$BACKEND_ECR_URI" || -z "$FRONTEND_ECR_URI" ]]; then
    print_error "ECR URIs are required for deployment"
    exit 1
fi

# Set the domains
FRONTEND_DOMAIN="cogniflow.bharatbhusal.com"
BACKEND_DOMAIN="backend-cogniflow.bharatbhusal.com"

print_status "Deploying CogniFlow with ECR images:"
print_status "Frontend: $FRONTEND_DOMAIN"
print_status "Backend: $BACKEND_DOMAIN"
print_status "Backend ECR: $BACKEND_ECR_URI"
print_status "Frontend ECR: $FRONTEND_ECR_URI"

# Export ECR image variables for docker-compose
export BACKEND_IMAGE="$BACKEND_ECR_URI:latest"
export FRONTEND_IMAGE="$FRONTEND_ECR_URI:latest"

# Step 1: Run system setup
print_status "Step 1/7: Setting up system..."
if [[ -f "./deploy-ec2.sh" ]]; then
    ./deploy-ec2.sh
else
    print_error "deploy-ec2.sh not found. Please ensure all files are in the current directory."
    exit 1
fi

# Step 2: Configure AWS CLI and ECR login
print_status "Step 2/7: Configuring AWS ECR access..."
if ! command -v aws &> /dev/null; then
    print_status "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws/
fi

print_status "Please configure AWS credentials if not already done:"
print_status "Run: aws configure"
print_warning "Make sure your AWS credentials have ECR access"

# Step 3: Configure security
print_status "Step 3/7: Configuring security..."
./configure-security.sh

# Step 4: Copy environment files
print_status "Step 4/7: Setting up environment files..."
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
print_success "Environment files configured"

# Step 5: Login to ECR and pull images
print_status "Step 5/7: Pulling ECR images..."
# Extract region from ECR URI (assuming format: account.dkr.ecr.region.amazonaws.com/repo)
ECR_REGION=$(echo $BACKEND_ECR_URI | cut -d'.' -f4)
print_status "Detected ECR region: $ECR_REGION"

# Login to ECR
aws ecr get-login-password --region $ECR_REGION | docker login --username AWS --password-stdin $(echo $BACKEND_ECR_URI | cut -d'/' -f1)

# Pull latest images
print_status "Pulling backend image: $BACKEND_IMAGE"
docker pull $BACKEND_IMAGE

print_status "Pulling frontend image: $FRONTEND_IMAGE"
docker pull $FRONTEND_IMAGE

# Step 6: Start the application
print_status "Step 6/7: Starting application..."
docker-compose  up -d

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 30

# Step 7: Setup SSL certificates for both domains
print_status "Step 7/7: Setting up SSL certificates..."

# Stop nginx temporarily
docker-compose  stop nginx

# Generate SSL certificates for both domains
if command -v certbot &> /dev/null; then
    print_status "Generating SSL certificate for frontend domain..."
    sudo certbot certonly --standalone -d $FRONTEND_DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    print_status "Generating SSL certificate for backend domain..."
    sudo certbot certonly --standalone -d $BACKEND_DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Create SSL directories and copy certificates
    sudo mkdir -p nginx/ssl/$FRONTEND_DOMAIN
    sudo mkdir -p nginx/ssl/$BACKEND_DOMAIN
    
    # Copy frontend certificates
    sudo cp /etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem nginx/ssl/$FRONTEND_DOMAIN/
    sudo cp /etc/letsencrypt/live/$FRONTEND_DOMAIN/privkey.pem nginx/ssl/$FRONTEND_DOMAIN/
    
    # Copy backend certificates  
    sudo cp /etc/letsencrypt/live/$BACKEND_DOMAIN/fullchain.pem nginx/ssl/$BACKEND_DOMAIN/
    sudo cp /etc/letsencrypt/live/$BACKEND_DOMAIN/privkey.pem nginx/ssl/$BACKEND_DOMAIN/
    
    # Set proper permissions
    sudo chown -R $USER:$USER nginx/ssl/
    
    # Start nginx with SSL
    docker-compose  up -d nginx
    
    print_success "SSL certificates configured successfully for both domains"
else
    print_error "Certbot not found. Please install certbot first."
    print_error "Run: sudo yum install -y certbot"
    exit 1
fi

# Final health check
print_status "Running health checks..."
sleep 10

# Run monitoring script
if [[ -f "./monitor-cogniflow.sh" ]]; then
    ./monitor-cogniflow.sh
fi

# Display deployment summary
echo ""
echo "🎉 CogniFlow ECR Deployment Complete!"
echo "====================================="
print_success "Your application is now running!"

echo "🌐 Frontend: https://$FRONTEND_DOMAIN"
echo "🔌 Backend API: https://$BACKEND_DOMAIN"

echo ""
echo "📋 What's been deployed:"
echo "✅ Frontend (React) from ECR - Port 3000"
echo "✅ Backend (FastAPI) from ECR - Port 8080" 
echo "✅ Database (PostgreSQL) - Port 5432"
echo "✅ Reverse Proxy (Nginx) - Ports 80/443"
echo "✅ SSL Certificate (Let's Encrypt) for both domains"
echo "✅ Security configurations"
echo "✅ Monitoring scripts"
echo "✅ Backup scripts"

echo ""
echo "📦 ECR Images Used:"
echo "Backend: $BACKEND_IMAGE"
echo "Frontend: $FRONTEND_IMAGE"

echo ""
echo "🔧 Useful commands:"
echo "- Monitor: ./monitor-cogniflow.sh"
echo "- Backup: ./backup-cogniflow.sh"
echo "- Update: ./update-cogniflow.sh"
echo "- Logs: docker-compose  logs -f"
echo "- Stop: docker-compose  down"
echo "- Start: BACKEND_IMAGE=$BACKEND_IMAGE FRONTEND_IMAGE=$FRONTEND_IMAGE docker-compose  up -d"
echo "- Renew SSL: ./renew-ssl.sh"

echo ""
echo "📖 Documentation:"
echo "- Full guide: AWS_EC2_DEPLOYMENT.md"
echo "- Security: SECURITY_CHECKLIST.md"

echo ""
print_warning "⚠️  Important reminders:"
echo "1. Update your AWS Security Groups to restrict access"
echo "2. Set up automated backups to S3"
echo "3. Configure monitoring and alerting"
echo "4. Use GitHub Actions for automated deployments"
echo "5. Test all functionality thoroughly"

echo ""
print_success "🚀 ECR-based deployment completed successfully!"# Step 6: Final health check
print_status "Step 6/6: Running health checks..."
sleep 10

# Run monitoring script
./monitor-cogniflow.sh

# Display deployment summary
echo ""
echo "🎉 CogniFlow Deployment Complete!"
echo "=================================="
print_success "Your application is now running!"

echo "🌐 Frontend: https://$FRONTEND_DOMAIN"
echo "🔌 Backend API: https://$BACKEND_DOMAIN"

echo ""
echo "📋 What's been deployed:"
echo "✅ Frontend (React) - Port 3000"
echo "✅ Backend (FastAPI) - Port 8080" 
echo "✅ Database (PostgreSQL) - Port 5432"
echo "✅ Reverse Proxy (Nginx) - Ports 80/443"
echo "✅ SSL Certificate (Let's Encrypt) for both domains"
echo "✅ Security configurations"
echo "✅ Monitoring scripts"
echo "✅ Backup scripts"

echo ""
echo "🔧 Useful commands:"
echo "- Monitor: ./monitor-cogniflow.sh"
echo "- Backup: ./backup-cogniflow.sh"
echo "- Update: ./update-cogniflow.sh"
echo "- Logs: docker-compose  logs -f"
echo "- Stop: docker-compose  down"
echo "- Start: docker-compose  up -d"

if [[ "$DOMAIN_NAME" != "localhost" ]]; then
    echo "- Renew SSL: ./renew-ssl.sh"
fi

echo ""
echo "📖 Documentation:"
echo "- Full guide: AWS_EC2_DEPLOYMENT.md"
echo "- Security: SECURITY_CHECKLIST.md"

echo ""
print_warning "⚠️  Important reminders:"
echo "1. Update your AWS Security Groups to restrict access"
echo "2. Set up automated backups to S3"
echo "3. Configure monitoring and alerting"
echo "4. Review and customize environment variables"
echo "5. Test all functionality thoroughly"

echo ""
print_success "🚀 Deployment completed successfully!"