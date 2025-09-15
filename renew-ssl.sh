#!/bin/bash

# SSL Certificate Renewal Script for CogniFlow (Dual Domain)

echo "🔐 Starting SSL certificate renewal at $(date)"

FRONTEND_DOMAIN="cogniflow.bharatbhusal.com"
BACKEND_DOMAIN="backend-cogniFlow.bharatbhusal.com"

# Stop nginx to allow certbot to bind to port 80
docker-compose  stop nginx

# Renew certificates for both domains
echo "🔄 Renewing SSL certificate for frontend domain: $FRONTEND_DOMAIN"
certbot renew --standalone --quiet --cert-name $FRONTEND_DOMAIN

echo "🔄 Renewing SSL certificate for backend domain: $BACKEND_DOMAIN"  
certbot renew --standalone --quiet --cert-name $BACKEND_DOMAIN

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem" ]; then
    # Frontend certificates
    mkdir -p nginx/ssl/$FRONTEND_DOMAIN
    cp /etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem nginx/ssl/$FRONTEND_DOMAIN/
    cp /etc/letsencrypt/live/$FRONTEND_DOMAIN/privkey.pem nginx/ssl/$FRONTEND_DOMAIN/
    
    echo "✅ Frontend SSL certificates renewed successfully"
else
    echo "❌ Frontend SSL certificate renewal failed"
fi

if [ -f "/etc/letsencrypt/live/$BACKEND_DOMAIN/fullchain.pem" ]; then
    # Backend certificates
    mkdir -p nginx/ssl/$BACKEND_DOMAIN
    cp /etc/letsencrypt/live/$BACKEND_DOMAIN/fullchain.pem nginx/ssl/$BACKEND_DOMAIN/
    cp /etc/letsencrypt/live/$BACKEND_DOMAIN/privkey.pem nginx/ssl/$BACKEND_DOMAIN/
    
    echo "✅ Backend SSL certificates renewed successfully"
else
    echo "❌ Backend SSL certificate renewal failed"
fi

# Set proper permissions
chown -R $USER:$USER nginx/ssl/

# Restart nginx
docker-compose  up -d nginx

# Verify SSL for both domains
sleep 10
echo "🔍 Verifying SSL certificates..."

if curl -f -s https://$FRONTEND_DOMAIN/health > /dev/null; then
    echo "✅ Frontend SSL verification successful"
else
    echo "❌ Frontend SSL verification failed"
fi

if curl -f -s https://$BACKEND_DOMAIN/api/open/health > /dev/null; then
    echo "✅ Backend SSL verification successful"
else
    echo "❌ Backend SSL verification failed"
fi

echo "🔚 SSL renewal completed at $(date)"