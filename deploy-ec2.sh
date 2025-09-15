#!/bin/bash

# CogniFlow AWS EC2 Deployment Script
# This script sets up and deploys the CogniFlow application on AWS EC2

set -e

echo "🚀 Starting CogniFlow deployment on EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if running on Ubuntu/Amazon Linux
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
else
    print_error "Cannot determine OS"
    exit 1
fi

print_status "Detected OS: $OS"

# Update system packages
print_status "Updating system packages..."
if [[ "$OS" == *"Amazon"* ]]; then
    sudo yum update -y
else
    print_error "This script is designed for Amazon Linux. Current OS: $OS"
    print_error "Please use Amazon Linux 2 or Amazon Linux 2023"
    exit 1
fi

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Install Docker on Amazon Linux
    sudo yum install -y docker
    
    # For Amazon Linux 2023, we might need to use dnf
    if ! systemctl is-active --quiet docker; then
        # Try with dnf if yum installation didn't work
        if command -v dnf &> /dev/null; then
            sudo dnf install -y docker
        fi
    fi
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Install Git if not present
print_status "Checking Git installation..."
if ! command -v git &> /dev/null; then
    sudo yum install -y git
    print_success "Git installed successfully"
else
    print_success "Git is already installed"
fi

# Install other useful tools
print_status "Installing additional tools..."
sudo yum install -y htop nginx
# Install certbot for Amazon Linux 2
sudo amazon-linux-extras install -y epel
sudo yum install -y certbot python3-certbot-nginx

# Configure firewall (iptables for Amazon Linux)
print_status "Configuring firewall..."
# For Amazon Linux, we'll rely on Security Groups and iptables
print_warning "Please ensure your EC2 Security Group allows ports 22, 80, 443, 3000, 8080"
print_warning "Consider configuring iptables for additional security"

# Create application directory
APP_DIR="/opt/cogniflow"
print_status "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

print_success "✅ EC2 setup completed! Next steps:"
echo "1. Clone your repository to $APP_DIR"
echo "2. Set up environment variables"
echo "3. Run docker-compose up -d"
echo "4. Configure Nginx reverse proxy (optional)"
echo "5. Set up SSL with Let's Encrypt (optional)"

print_warning "⚠️  Don't forget to:"
echo "- Configure your AWS Security Groups"
echo "- Set up your domain DNS records"
echo "- Create production .env files"