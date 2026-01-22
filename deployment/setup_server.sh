#!/bin/bash

# setup_server.sh
# Usage: ./setup_server.sh <EC2_PUBLIC_IP> <PATH_TO_PEM_KEY>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <EC2_PUBLIC_IP> <PATH_TO_PEM_KEY>"
    exit 1
fi

EC2_HOST=$1
KEY_PATH=$2
USER="ec2-user" # Amazon Linux 2023 default user

echo "Connecting to $EC2_HOST as $USER..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$USER@$EC2_HOST" << 'EOF'
    echo "Updating system packages..."
    sudo dnf update -y
    
    echo "Installing Docker..."
    sudo dnf install -y docker
    
    echo "Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker

    echo "Adding user to docker group..."
    sudo usermod -aG docker ec2-user
    
    echo "Installing Docker Compose manually..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

    echo "Docker installed successfully!"
    docker --version
    docker compose version
EOF

echo "Server setup complete!"
