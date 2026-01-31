#!/bin/bash
# BodhaSurvey Deployment Script
# Run this on your AWS server

echo "=================================="
echo "BodhaSurvey Deployment Starting"
echo "=================================="
echo ""

# Navigate to project directory
cd /home/ubuntu/BodhaSurvey || cd ~/BodhaSurvey || { echo "Error: BodhaSurvey directory not found"; exit 1; }

echo "✓ Current directory: $(pwd)"
echo ""

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "Error: Git pull failed"
    exit 1
fi
echo "✓ Code updated successfully"
echo ""

# Stop existing containers
echo "Stopping existing containers..."
sudo docker compose down
echo "✓ Containers stopped"
echo ""

# Rebuild and start containers
echo "Building and starting containers..."
echo "(This may take 5-10 minutes...)"
sudo docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✓ Deployment Successful!"
    echo "=================================="
    echo ""
    echo "Checking container status..."
    sudo docker compose ps
    echo ""
    echo "Your application should be running at:"
    echo "https://bodhasurvey.duckdns.org/"
    echo ""
    echo "To view logs: sudo docker compose logs -f"
else
    echo ""
    echo "=================================="
    echo "✗ Deployment Failed"
    echo "=================================="
    echo ""
    echo "Check logs with: sudo docker compose logs"
    exit 1
fi
