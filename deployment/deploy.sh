#!/bin/bash

# deploy.sh
# Usage: ./deploy.sh <EC2_PUBLIC_IP> <PATH_TO_PEM_KEY>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <EC2_PUBLIC_IP> <PATH_TO_PEM_KEY>"
    exit 1
fi

EC2_HOST=$1
KEY_PATH=$2
USER="ec2-user"
REMOTE_DIR="~/BodhaAIProd"

# Ensure script is executable
chmod +x "$0"

echo "Deploying to $EC2_HOST..."

# 1. Sync files to the server
echo "Syncing files..."
# Construct rsync command to exclude unnecessary files
rsync -avz -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'mongodb_data' \
    --exclude 'postgres_data' \
    --exclude 'redis_data' \
    --exclude 'build' \
    --rsync-path="sudo rsync" \
    . "$USER@$EC2_HOST:$REMOTE_DIR"

# 2. Start the application
echo "Starting application..."
ssh -i "$KEY_PATH" "$USER@$EC2_HOST" << EOF
    cd $REMOTE_DIR
    
    # create .env file if it doesn't exist (basic version)
    if [ ! -f .env ]; then
        echo "Creating default .env..."
        echo "NODE_ENV=production" > .env
    fi

    echo "Stopping existing containers..."
    docker compose down --remove-orphans

    echo "Building and starting new containers..."
    docker compose up -d --build

    echo "Deployment complete! Checking status..."
    sleep 5
    docker compose ps
EOF

echo "Application deployed! Access it at http://$EC2_HOST"
