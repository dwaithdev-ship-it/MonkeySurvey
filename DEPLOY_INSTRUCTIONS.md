# Deploying BodhaSurvey to AWS EC2

Follow these steps to deploy your application to an AWS EC2 instance.

## 1. Launch EC2 Instance

1.  Log in to AWS Console.
2.  Go to **EC2** > **Launch Instance**.
3.  **Name**: BodhaSurvey-Server
4.  **OS Image**: Ubuntu Server 22.04 LTS (HVM).
5.  **Instance Type**: t3.medium or larger (need at least 4GB RAM for all containers).
6.  **Key Pair**: Create new or select existing (save the `.pem` file).
7.  **Network Settings**:
    *   Allow SSH traffic from Anywhere (or your IP).
    *   Allow HTTP traffic from the internet.
    *   Allow HTTPS traffic from the internet.
8.  **Launch Instance**.

## 2. Configure Security Group

1.  Go to the Security Group associated with your instance.
2.  Edit **Inbound rules**.
3.  Add the following rules:
    *   **Custom TCP** | Port **3000** | Source **Anywhere** (0.0.0.0/0) - API Gateway
    *   **Custom TCP** | Port **80**   | Source **Anywhere** (0.0.0.0/0) - Frontend
    *   **Custom TCP** | Port **3001-3006** | Source **Anywhere** (0.0.0.0/0) - Microservices (Optional, for debugging)

## 3. Connect to Instance

Open your terminal (or Putty) and connect:

```bash
ssh -i /path/to/your-key.pem ubuntu@<your-ec2-public-ip>
```

## 4. Get the Code

You need to get your code onto the server. You can use Git.

```bash
# Install Git
sudo apt-get update
sudo apt-get install -y git

# Clone repository (replace with your repo URL)
git clone https://github.com/dwaithdev-ship-it/BodhaSurvey.git
cd BodhaSurvey
```

*Note: If your repo is private, you may need to use a Personal Access Token or SSH key.*

## 5. Run Deployment Script

I have created an automated deployment script `deploy-aws.sh`.

```bash
# Make script executable
chmod +x deploy-aws.sh

# Run it
./deploy-aws.sh
```

This script will:
1.  Install Docker and Docker Compose.
2.  Setup basic environment variables.
3.  Build and start all services.

## 6. Access Application

Once the script finishes, you can access your app at:

*   **Frontend**: `http://<your-ec2-public-ip>`
*   **API**: `http://<your-ec2-public-ip>:3000`

## Production Notes

*   **Database**: For a real production data, consider using AWS RDS (PostgreSQL) and MongoDB Atlas instead of the local containers. Update the `.env` files in `backend/` with the connection strings.
*   **Domain**: To use a real domain (e.g., mysurvey.com), point your DNS to the EC2 IP and configure Nginx / Certbot for SSL.
