#!/bin/bash

# CogniFlow Security Configuration Script
# This script implements additional security measures for production deployment

set -e

echo "🔒 Configuring security for CogniFlow deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[SECURITY]${NC} $1"
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

# Function to generate secure passwords
generate_password() {
    openssl rand -base64 32
}

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64
}

# Create secure environment files
print_status "Generating secure environment variables..."

# Generate secure passwords
DB_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_jwt_secret)
SECRET_KEY=$(generate_password)

# Update backend .env file
if [ -f "backend/.env" ]; then
    sed -i "s/YOUR_STRONG_PASSWORD/$DB_PASSWORD/g" backend/.env
    sed -i "s/your-super-secure-jwt-secret-key-at-least-32-characters-long/$JWT_SECRET/g" backend/.env
    sed -i "s/your-super-secret-key-for-security-purposes-make-it-long-and-random/$SECRET_KEY/g" backend/.env
    print_success "Backend environment file updated with secure credentials"
else
    print_error "Backend .env file not found. Please ensure it exists."
    exit 1
fi

# Set proper file permissions
print_status "Setting secure file permissions..."
chmod 600 backend/.env
chmod 600 frontend/.env
chmod 755 deploy-ec2.sh
chmod 644 docker-compose.prod.yml
chmod 644 nginx/nginx.conf

print_success "File permissions set securely"

# Create fail2ban configuration for additional security
print_status "Creating fail2ban configuration..."
cat > fail2ban-cogniflow.conf << 'EOF'
[cogniflow-auth]
enabled = true
port = 80,443
protocol = tcp
filter = cogniflow-auth
logpath = /opt/cogniflow/nginx/logs/access.log
maxretry = 5
bantime = 3600
findtime = 600

[cogniflow-api]
enabled = true
port = 80,443
protocol = tcp
filter = cogniflow-api
logpath = /opt/cogniflow/nginx/logs/access.log
maxretry = 10
bantime = 1800
findtime = 300
EOF

# Create fail2ban filters
mkdir -p fail2ban-filters

cat > fail2ban-filters/cogniflow-auth.conf << 'EOF'
[Definition]
failregex = ^<HOST> - .* "POST /api/auth/.* HTTP/1\.." (401|403|422) .*$
ignoreregex =
EOF

cat > fail2ban-filters/cogniflow-api.conf << 'EOF'
[Definition]
failregex = ^<HOST> - .* "(GET|POST|PUT|DELETE) /api/.* HTTP/1\.." (429|500|502|503|504) .*$
ignoreregex =
EOF

print_success "Fail2ban configuration created"

# Create monitoring script
print_status "Creating monitoring script..."
cat > monitor-cogniflow.sh << 'EOF'
#!/bin/bash

# CogniFlow Monitoring Script
# This script monitors the health of your CogniFlow deployment

echo "🔍 CogniFlow Health Check $(date)"
echo "=================================="

# Check Docker containers
echo "📦 Container Status:"
docker-compose  ps

# Check disk usage
echo ""
echo "💾 Disk Usage:"
df -h /

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h

# Check CPU load
echo ""
echo "⚡ CPU Load:"
uptime

# Check specific service health
echo ""
echo "🏥 Service Health Checks:"

# Backend health check
if curl -f -s http://localhost:8080/api/open/health > /dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Unhealthy"
fi

# Frontend health check
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Unhealthy"
fi

# Database health check
if docker exec cogniFlow-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database: Healthy"
else
    echo "❌ Database: Unhealthy"
fi

# Nginx health check
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Nginx: Healthy"
else
    echo "❌ Nginx: Unhealthy"
fi

echo ""
echo "📊 Recent Logs (last 10 lines):"
docker-compose  logs --tail=10

echo ""
echo "🔚 Health check completed at $(date)"
EOF

chmod +x monitor-cogniflow.sh

# Create backup script
print_status "Creating backup script..."
cat > backup-cogniflow.sh << 'EOF'
#!/bin/bash

# CogniFlow Backup Script
# This script creates backups of your database and important files

BACKUP_DIR="/opt/cogniflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="your-cogniflow-backups"  # Change this to your S3 bucket

echo "🗄️ Starting CogniFlow backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "📦 Backing up database..."
docker exec cogniFlow-postgres pg_dump -U postgres cogniflow > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Backup environment files
echo "⚙️ Backing up configuration..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz backend/.env frontend/.env nginx/nginx.conf

# Backup uploaded files (if any)
if [ -d "backend/uploads" ]; then
    echo "📄 Backing up uploaded files..."
    tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz backend/uploads/
fi

# Upload to S3 (optional - uncomment if you have AWS CLI configured)
# echo "☁️ Uploading to S3..."
# aws s3 cp $BACKUP_DIR/ s3://$S3_BUCKET/backups/$(date +%Y/%m/%d)/ --recursive

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "✅ Backup completed at $(date)"
echo "📍 Backups stored in: $BACKUP_DIR"
ls -la $BACKUP_DIR/
EOF

chmod +x backup-cogniflow.sh

# Create update script
print_status "Creating update script..."
cat > update-cogniflow.sh << 'EOF'
#!/bin/bash

# CogniFlow Update Script
# This script safely updates your CogniFlow deployment

set -e

echo "🔄 Starting CogniFlow update at $(date)"

# Create backup before update
echo "📦 Creating backup before update..."
./backup-cogniflow.sh

# Pull latest code
echo "⬇️ Pulling latest code..."
git stash  # Stash local changes
git pull origin main

# Rebuild containers
echo "🏗️ Rebuilding containers..."
docker-compose  build --no-cache

# Update containers
echo "🚀 Updating containers..."
docker-compose  up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
./monitor-cogniflow.sh

echo "✅ Update completed successfully at $(date)"
EOF

chmod +x update-cogniflow.sh

# Create SSL renewal script
print_status "Creating SSL renewal script..."
cat > renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script for CogniFlow

echo "🔐 Starting SSL certificate renewal at $(date)"

# Stop nginx to allow certbot to bind to port 80
docker-compose  stop nginx

# Renew certificates
certbot renew --standalone --quiet

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/yourdomain.com/fullchain.pem" ]; then
    cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
    chown $USER:$USER nginx/ssl/*
    echo "✅ SSL certificates renewed successfully"
else
    echo "❌ SSL certificate renewal failed"
    exit 1
fi

# Restart nginx
docker-compose  up -d nginx

# Verify SSL
sleep 10
if curl -f -s https://yourdomain.com/health > /dev/null; then
    echo "✅ SSL verification successful"
else
    echo "❌ SSL verification failed"
fi

echo "🔚 SSL renewal completed at $(date)"
EOF

chmod +x renew-ssl.sh

# Create system hardening recommendations
print_status "Creating system hardening checklist..."
cat > SECURITY_CHECKLIST.md << 'EOF'
# CogniFlow Security Checklist

## System Level Security

### ✅ SSH Security
- [ ] Disable root login: `PermitRootLogin no` in `/etc/ssh/sshd_config`
- [ ] Change default SSH port: `Port 2222` in `/etc/ssh/sshd_config`
- [ ] Use SSH key authentication only: `PasswordAuthentication no`
- [ ] Enable SSH connection limits: `MaxAuthTries 3`

### ✅ Firewall Configuration
- [ ] Configure Security Groups to allow only necessary ports (22, 80, 443)
- [ ] Set up iptables rules for additional security
- [ ] Configure fail2ban for intrusion prevention

### ✅ System Updates
- [ ] Enable automatic security updates
- [ ] Regular system patching schedule
- [ ] Monitor security advisories

### ✅ User Management
- [ ] Create dedicated application user
- [ ] Disable unused user accounts
- [ ] Implement strong password policies

## Application Level Security

### ✅ Environment Variables
- [ ] Use strong, unique passwords (32+ characters)
- [ ] Rotate JWT secrets regularly
- [ ] Secure API keys and tokens
- [ ] Environment files have restricted permissions (600)

### ✅ Database Security
- [ ] Use strong database passwords
- [ ] Limit database connections to application only
- [ ] Regular database backups
- [ ] Enable database logging and monitoring

### ✅ Web Application Security
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting implemented
- [ ] Input validation and sanitization

### ✅ Docker Security
- [ ] Run containers with non-root users
- [ ] Use official base images
- [ ] Regular image updates
- [ ] Limit container resources

## Monitoring and Logging

### ✅ Application Monitoring
- [ ] Health check endpoints implemented
- [ ] Application metrics collection
- [ ] Error tracking and alerting
- [ ] Performance monitoring

### ✅ Security Monitoring
- [ ] Failed login attempt monitoring
- [ ] Suspicious activity detection
- [ ] Log aggregation and analysis
- [ ] Incident response procedures

### ✅ Infrastructure Monitoring
- [ ] System resource monitoring
- [ ] Network traffic analysis
- [ ] Disk usage alerts
- [ ] Service uptime monitoring

## Backup and Recovery

### ✅ Data Backup
- [ ] Automated daily database backups
- [ ] Configuration files backup
- [ ] Off-site backup storage (S3)
- [ ] Backup restoration testing

### ✅ Disaster Recovery
- [ ] Documented recovery procedures
- [ ] Regular disaster recovery testing
- [ ] Multiple availability zones
- [ ] Load balancer configuration

## Compliance and Documentation

### ✅ Documentation
- [ ] Security incident response plan
- [ ] Regular security assessment schedule
- [ ] User access documentation
- [ ] Change management procedures

### ✅ Regular Tasks
- [ ] Weekly security log review
- [ ] Monthly vulnerability scanning
- [ ] Quarterly security assessment
- [ ] Annual penetration testing
EOF

# Set ownership and permissions for all created files
print_status "Setting final permissions..."
find . -name "*.sh" -exec chmod +x {} \;
find . -name "*.md" -exec chmod 644 {} \;
find . -name "*.conf" -exec chmod 644 {} \;

print_success "✅ Security configuration completed!"
echo ""
echo "📋 Created files:"
echo "- monitor-cogniflow.sh    (Health monitoring)"
echo "- backup-cogniflow.sh     (Automated backups)" 
echo "- update-cogniflow.sh     (Safe application updates)"
echo "- renew-ssl.sh           (SSL certificate renewal)"
echo "- SECURITY_CHECKLIST.md  (Security hardening guide)"
echo "- fail2ban-cogniflow.conf (Intrusion prevention)"
echo ""
echo "📌 Next steps:"
echo "1. Review and customize all generated files"
echo "2. Update domain names in configuration files"
echo "3. Set up cron jobs for automated tasks"
echo "4. Configure AWS S3 for backups (optional)"
echo "5. Install and configure fail2ban"
echo ""
print_warning "⚠️  Remember to:"
echo "- Change default passwords in .env files"
echo "- Update domain names in all configuration files"
echo "- Test all scripts before using in production"
echo "- Regularly review security logs and metrics"
EOF