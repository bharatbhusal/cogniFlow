# CogniFlow AWS EC2 Deployment Guide (ECR-Based)

## Overview

This guide will help you deploy the CogniFlow application on AWS EC2 using Docker, ECR (Elastic Container Registry), and GitHub Actions for CI/CD.

## Prerequisites

- AWS account with EC2 and ECR access
- GitHub repository with Actions enabled
- Domain names: `cogniflow.bharatbhusal.com` and `backend-cogniflow.bharatbhusal.com`
- Basic knowledge of AWS console and SSH

## Architecture

- **Frontend**: React application (port 3000) - served from ECR
- **Backend**: FastAPI application (port 8080) - served from ECR
- **Database**: PostgreSQL (port 5432)
- **Reverse Proxy**: Nginx (ports 80/443)
- **CI/CD**: GitHub Actions → ECR → EC2

## Step 0: Setup ECR Repositories

### 0.1 Create ECR Repositories

Before deploying, create two ECR repositories in AWS:

```bash
# Create backend repository
aws ecr create-repository --repository-name cogniflow-backend --region ap-south-1

# Create frontend repository
aws ecr create-repository --repository-name cogniflow-frontend --region ap-south-1
```

### 0.2 Configure GitHub Secrets

In your GitHub repository, add these secrets (Settings → Secrets and variables → Actions):

| Secret Name             | Description         | Example                           |
| ----------------------- | ------------------- | --------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS Access Key      | `AKIA...`                         |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key      | `wJa...`                          |
| `EC2_SSH_PRIVATE_KEY`   | EC2 SSH Private Key | `-----BEGIN RSA PRIVATE KEY-----` |
| `AWS_EC2_IP_TEST`       | EC2 Public IP       | `1.2.3.4`                         |
| `REPO_NAME_TEST`        | Base ECR repo name  | `cogniflow`                       |

**Note**: With `REPO_NAME_TEST=cogniflow`, GitHub Actions will push to:

- `cogniflow-backend:latest`
- `cogniflow-frontend:latest`

## Step 1: Launch EC2 Instance

### 1.1 Instance Configuration

- **AMI**: Amazon Linux 2 or Amazon Linux 2023
- **Instance Type**: t3.medium (minimum) or t3.large (recommended)
- **Storage**: 20GB gp3 SSD (minimum)
- **Key Pair**: Create or select existing key pair

### 1.2 Security Group Configuration

Create a security group with the following inbound rules:

| Port | Protocol | Source    | Description |
| ---- | -------- | --------- | ----------- |
| 22   | TCP      | Your IP   | SSH access  |
| 80   | TCP      | 0.0.0.0/0 | HTTP        |
| 443  | TCP      | 0.0.0.0/0 | HTTPS       |

⚠️ **Security Note**: Ports 3000 and 8080 are not exposed publicly. All traffic goes through Nginx reverse proxy.

## Step 2: Connect to EC2 Instance

```bash
# SSH into your Amazon Linux EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

## Step 3: Setup ECR-Based Deployment

### 3.1 Quick Setup (Recommended)

```bash
# Clone your repository
git clone https://github.com/bharatbhusal/cogniflow.git
cd cogniflow

# Run the ECR-based quick deploy script
./quick-deploy.sh
```

### 3.2 Manual Setup

```bash
# Run system setup
./deploy-ec2.sh

# Configure security
./configure-security.sh

# Set up environment files
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Set ECR image variables
export BACKEND_IMAGE="your-account.dkr.ecr.ap-south-1.amazonaws.com/cogniflow-backend:latest"
export FRONTEND_IMAGE="your-account.dkr.ecr.ap-south-1.amazonaws.com/cogniflow-frontend:latest"

# Deploy with ECR images
docker-compose  up -d
```

## Step 4: Environment Configuration

### 4.1 Backend Environment Variables

Your production backend environment (`.env.production`) uses only existing variables:

```bash
# Database
POSTGRES_DB_URL=postgresql+psycopg://postgres:postgres@postgres:5432/cogniflow

# Authentication
AUTH_SECRET_KEY=your-auth-secret-key

# AI Services
OPENAI_API_KEY=your-openai-api-key

# ChromaDB
CHROMADB_API_KEY=your-chroma-api-key
CHROMADB_TENANT=tenant
CHROMADB_DATABASE=database-env

# Pockity Storage
POCKITY_ACCESS_KEY_ID=pockity-accexx-key-id
POCKITY_SECRET_KEY=secret-key
POCKITY_API_URL=https://pockity.bharatbhusal.com/api/storage

# Debug mode (set to False for production)
DEBUG=False
```

### 4.2 Frontend Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://backend-cogniflow.bharatbhusal.com
```

## Step 5: CI/CD with GitHub Actions

### 5.1 Automated Deployment

The workflow is triggered on push to `prod` branch:

```bash
# Deploy via GitHub Actions
git checkout main
git checkout -b prod
git push origin prod
```

### 5.2 Manual ECR Update

If you need to manually update images on EC2:

```bash
# On EC2 instance
./ecr-deploy.sh
```

### 7.1 DNS Configuration

Point both domains to your EC2 instance:

- Create an A record for `cogniflow.bharatbhusal.com` pointing to your EC2 public IP
- Create an A record for `backend-cogniflow.bharatbhusal.com` pointing to your EC2 public IP

### 7.2 Domain Architecture

- **Frontend Domain**: `cogniflow.bharatbhusal.com` - Serves the React frontend
- **Backend Domain**: `backend-cogniflow.bharatbhusal.com` - Serves the FastAPI backend

This separation provides better security and allows independent scaling of services.

## Step 8: SSL Certificate Setup for Both Domains

### 8.1 Using Let's Encrypt (Automated via quick-deploy.sh)

The quick-deploy script automatically handles SSL certificate generation for both domains:

- `cogniflow.bharatbhusal.com` (Frontend)
- `backend-cogniflow.bharatbhusal.com` (Backend)

### 8.2 Manual SSL Setup (if needed)

```bash
# Stop nginx container temporarily
docker-compose  stop nginx

# Generate SSL certificates for both domains
sudo certbot certonly --standalone -d cogniflow.bharatbhusal.com --email your-email@domain.com --agree-tos --non-interactive
sudo certbot certonly --standalone -d backend-cogniflow.bharatbhusal.com --email your-email@domain.com --agree-tos --non-interactive

# Create SSL directories and copy certificates
sudo mkdir -p nginx/ssl/cogniflow.bharatbhusal.com
sudo mkdir -p nginx/ssl/backend-cogniflow.bharatbhusal.com

# Copy frontend certificates
sudo cp /etc/letsencrypt/live/cogniflow.bharatbhusal.com/fullchain.pem nginx/ssl/cogniflow.bharatbhusal.com/
sudo cp /etc/letsencrypt/live/cogniflow.bharatbhusal.com/privkey.pem nginx/ssl/cogniflow.bharatbhusal.com/

# Copy backend certificates
sudo cp /etc/letsencrypt/live/backend-cogniflow.bharatbhusal.com/fullchain.pem nginx/ssl/backend-cogniflow.bharatbhusal.com/
sudo cp /etc/letsencrypt/live/backend-cogniflow.bharatbhusal.com/privkey.pem nginx/ssl/backend-cogniflow.bharatbhusal.com/

# Set proper permissions
sudo chown -R $USER:$USER nginx/ssl/

# Restart nginx
docker-compose  up -d nginx
```

### 8.2 Certificate Auto-Renewal

Add to crontab for automatic renewal:

```bash
sudo crontab -e
```

Add this line:

```
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/cogniflow/docker-compose.prod.yml restart nginx
```

## Step 9: Security Hardening

### 9.1 Update Security Group

Remove direct access to application ports:

- Remove port 3000 (frontend will be served via Nginx)
- Remove port 8080 (API will be proxied via Nginx)
- Keep only ports 22, 80, and 443 open

### 9.2 Configure iptables (Amazon Linux)

```bash
# Basic iptables configuration
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP

# Save iptables rules
sudo service iptables save
```

## Step 6: DNS Configuration

Configure your DNS records to point to your EC2 instance:

### A Records

- `cogniflow.bharatbhusal.com` → Your EC2 IP
- `backend-cogniflow.bharatbhusal.com` → Your EC2 IP

## Step 7: SSL Certificate Setup

SSL certificates are automatically configured during deployment via Let's Encrypt:

```bash
# Certificates are automatically generated for both domains
# cogniflow.bharatbhusal.com
# backend-cogniflow.bharatbhusal.com

# Certificate renewal is automated via cron job
sudo crontab -l  # Verify renewal schedule
```

## Step 8: Monitoring and Maintenance

### 8.1 View Application Logs

```bash
# View all service logs
docker-compose  logs

# View specific service logs
docker-compose  logs backend
docker-compose  logs frontend
docker-compose  logs nginx
```

### 8.2 Health Checks

```bash
# Check backend API health
curl https://backend-cogniflow.bharatbhusal.com/api/open/health

# Check frontend accessibility
curl https://cogniflow.bharatbhusal.com
```

### 8.3 Update Images via GitHub Actions

```bash
# Push to prod branch to trigger deployment
git checkout main
git push origin main:prod
```

### 8.4 Manual ECR Image Updates

```bash
# Pull latest images from ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Update via script
./ecr-deploy.sh
```

## Troubleshooting

### Common Issues

1. **ECR Login Issues**

   ```bash
   # Re-authenticate with ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **SSL Certificate Issues**

   ```bash
   # Check certificate status
   sudo certbot certificates

   # Renew certificates manually
   sudo certbot renew
   ```

3. **GitHub Actions Deployment Failures**

   - Verify GitHub secrets are correctly set
   - Check ECR repository permissions
   - Review GitHub Actions logs for specific errors

4. **API Routing Issues**

   ```bash
   # Verify nginx configuration
   sudo nginx -t

   # Check API endpoint accessibility
   curl https://backend-cogniflow.bharatbhusal.com/api/open/health
   ```

5. **Docker Container Issues**

   ```bash
   # Restart all services
   docker-compose  restart

   # Check container status
   docker-compose  ps
   ```

## Architecture Overview

- **Frontend**: React app served via Nginx on `cogniflow.bharatbhusal.com`
- **Backend**: FastAPI application on `backend-cogniflow.bharatbhusal.com` with `/api` prefix routing
- **Database**: PostgreSQL with persistent storage
- **SSL**: Let's Encrypt certificates for both domains
- **CI/CD**: GitHub Actions with ECR image builds and automated deployment
- **Infrastructure**: Amazon Linux 2/2023 on AWS EC2 with Docker Compose orchestration

## Troubleshooting

### Common Issues

1. **Containers not starting**

   ```bash
   docker-compose  logs
   ```

2. **Permission denied errors**

   ```bash
   sudo chown -R $USER:$USER /opt/cogniflow
   ```

3. **Database connection issues**

   - Check if PostgreSQL container is running
   - Verify environment variables
   - Check database logs

4. **SSL certificate issues**
   - Ensure domain DNS is properly configured
   - Check certificate file permissions
   - Verify Nginx configuration

### Useful Commands

```bash
# Restart all services
docker-compose  restart

# Update application
git pull origin main
docker-compose  build
docker-compose  up -d

# View resource usage
docker stats

# Clean up old images
docker system prune -f
```

## Performance Optimization

### 10.1 Enable Docker BuildKit

```bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

### 10.2 Optimize Database

```bash
# Connect to PostgreSQL container
docker exec -it cogniFlow-postgres psql -U postgres -d cogniflow

-- Run these optimization queries
ANALYZE;
REINDEX DATABASE cogniflow;
```

### 10.3 Monitor System Resources

```bash
# Install monitoring tools
htop
iostat
free -h
df -h
```

## Scaling Considerations

For high traffic applications, consider:

- Using Application Load Balancer (ALB)
- Setting up multiple EC2 instances
- Using Amazon RDS for PostgreSQL
- Implementing Redis for caching
- Using CloudFront CDN

## Support

For issues and questions:

- Check the application logs
- Review AWS CloudWatch metrics
- Monitor EC2 instance health
- Check security group configurations

---

**🚀 Your CogniFlow application should now be successfully deployed on AWS EC2!**

Access your application at:

- **Frontend**: `https://cogniflow.bharatbhusal.com`
- **Backend API**: `https://backend-cogniflow.bharatbhusal.com`
