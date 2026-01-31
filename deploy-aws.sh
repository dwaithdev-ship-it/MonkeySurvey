#!/bin/bash

# BodhaSurvey AWS Deployment Script
# Run this script on your Ubuntu EC2 instance

echo "Starting deployment..."

# 1. Install Docker & Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# 2. Setup Permissions
sudo usermod -aG docker $USER
echo "Docker installed. You may need to logout and login again for group changes to take effect."

# 3. Create .env files from examples if they don't exist
# Backend services
for service in user-service survey-service response-service analytics-service notification-service api-gateway; do
    if [ ! -f "backend/$service/.env" ]; then
        if [ -f "backend/$service/.env.example" ]; then
            echo "Creating .env for $service..."
            cp "backend/$service/.env.example" "backend/$service/.env"
        else
            echo "Warning: No .env.example found for $service"
        fi
    fi
done

# Frontend
if [ ! -f "frontend/.env" ]; then
   # Create a basic production env for frontend
   echo "VITE_API_URL=http://$(curl -s http://checkip.amazonaws.com):3000" > frontend/.env
fi

# 4. Stop existing services
echo "Stopping existing services..."
sudo docker compose down

# 5. Build and Start
echo "Building and starting services..."
sudo docker compose build
sudo docker compose up -d

echo "Deployment complete! Application should be running."
echo "Frontend: http://$(curl -s http://checkip.amazonaws.com)"
echo "API Gateway: http://$(curl -s http://checkip.amazonaws.com):3000"
