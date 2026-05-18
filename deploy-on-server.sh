#!/bin/bash
# ============================================================
# MonkeySurvey Production Deploy Script
# Run this in the AWS EC2 Instance Connect browser terminal
# Server: 13.53.187.131 (eu-north-1)
# ============================================================

set -e

echo "========================================"
echo "  MonkeySurvey Production Deployment"
echo "  $(date)"
echo "========================================"

# --- 1. Navigate to project directory ---
if [ -d "/home/ubuntu/BodhaSurvey" ]; then
    cd /home/ubuntu/BodhaSurvey
elif [ -d "$HOME/BodhaSurvey" ]; then
    cd $HOME/BodhaSurvey
else
    echo "❌ BodhaSurvey directory not found. Cloning..."
    cd /home/ubuntu
    git clone https://github.com/dwaithdev-ship-it/MonkeySurvey.git BodhaSurvey
    cd BodhaSurvey
fi

echo "✓ Directory: $(pwd)"

# --- 2. Pull latest code ---
echo ""
echo "→ Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main
echo "✓ Code updated to: $(git log --oneline -1)"

# --- 3. Stop existing containers ---
echo ""
echo "→ Stopping existing containers..."
sudo docker compose down 2>/dev/null || sudo docker-compose down 2>/dev/null || true
echo "✓ Containers stopped"

# --- 4. Clean old images to free space (optional but safe) ---
echo ""
echo "→ Removing dangling Docker images..."
sudo docker image prune -f 2>/dev/null || true

# --- 5. Build & start all services ---
echo ""
echo "→ Building and starting all services..."
echo "  (This may take 5-10 minutes on first run)"
sudo docker compose up -d --build 2>/dev/null || sudo docker-compose up -d --build
echo "✓ Services started"

# --- 6. Wait for services to be ready ---
echo ""
echo "→ Waiting 15 seconds for services to initialize..."
sleep 15

# --- 7. Verify ---
echo ""
echo "→ Container status:"
sudo docker compose ps 2>/dev/null || sudo docker-compose ps

echo ""
echo "→ Testing API Gateway health..."
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health

echo ""
echo "→ Testing Frontend (port 80)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:80

echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Web App: http://13.53.187.131"
echo "API:     http://13.53.187.131/api"
echo "Health:  http://13.53.187.131/api/health"
echo "========================================"
echo ""
echo "If anything failed, check logs with:"
echo "  sudo docker compose logs -f --tail=50"
