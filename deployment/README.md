# Deployment Guide for MonkeySurvey

This guide explains how to deploy the MonkeySurvey application to your AWS EC2 instance using the provided scripts.

## Prerequisites
1.  **AWS EC2 Instance**: You have an instance running (e.g., Ubuntu).
2.  **Public IP**: Use the IP address of your instance (e.g., `1.2.3.4`).
3.  **Private Key (.pem)**: You have the `.pem` file used to create the instance (e.g., `my-key.pem`).
4.  **Security Group**: Ensure port **80** (HTTP) and **22** (SSH) are open in your EC2 Security Group.

## Instructions

### Step 0: Prepare Scripts (Already done)
The scripts are located in the `deployment/` folder and have been made executable.

### Step 1: Setup the Server
Run this script once to install Docker and Docker Compose on your EC2 instance.

```bash
cd deployment
./setup_server.sh <YOUR_EC2_IP> <PATH_TO_PEM_FILE>
```

**Example:**
```bash
./setup_server.sh 13.56.78.90 ~/Downloads/my-key.pem
```

### Step 2: Deploy the Application
Run this script to copy your code to the server and start the application.

```bash
./deploy.sh <YOUR_EC2_IP> <PATH_TO_PEM_FILE>
```

**Example:**
```bash
./deploy.sh 13.56.78.90 ~/Downloads/my-key.pem
```

After deployment, open `http://<YOUR_EC2_IP>` in your browser.

## Troubleshooting
-   **Permission Denied (publickey)**: Ensure your `.pem` file has correct permissions (`chmod 400 key.pem`).
-   **Timeout**: Check your AWS Security Group to ensure port 22 (SSH) and 80 (HTTP) are allowed from your IP / Anywhere.
-   **Docker not found**: Verify Step 1 completed successfully without errors.
