# AWS Deployment Guide - BodhaSurvey

## Current Situation
- ✅ Code pushed to GitHub successfully
- ✅ Latest features: Phone Login, Offline Mode, Safari Fix
- ❌ SSH connection failing (key mismatch issue)
- 🔧 Need to deploy to: 13.49.231.22

## Quick Deployment (Recommended - 2 minutes)

### Method 1: AWS Console (Easiest)

1. **Open AWS Console**: https://console.aws.amazon.com/
2. **Navigate**: EC2 → Instances
3. **Find your instance** (should show IP: 13.49.231.22)
4. **Click "Connect"** button at the top
5. **Choose "EC2 Instance Connect"** tab
6. **Click "Connect"** - Opens browser terminal
7. **Run these commands one by one:**

```bash
cd BodhaSurvey
git pull origin main
sudo docker compose down
sudo docker compose up -d --build
```

**Wait 5-10 minutes for Docker to rebuild all containers.**

### Method 2: AWS Systems Manager

1. **Navigate**: AWS Console → Systems Manager → Session Manager
2. **Click "Start session"**
3. **Select your instance**
4. **Run the same commands as Method 1**

## After Deployment

### Update DNS
1. Go to: https://www.duckdns.org/
2. Login to your account
3. Update `bodhasurvey` domain IP to: **13.49.231.22**
4. Wait 5-10 minutes for DNS propagation

### Verify Deployment
Visit: https://bodhasurvey.duckdns.org/

You should see:
- ✅ Login page with **Phone Number** field (not email)
- ✅ Works on iOS Safari
- ✅ Offline mode enabled

## Troubleshooting SSH (Optional)

If you want to fix SSH for future deployments:

### Check Key Pair Name
1. AWS Console → EC2 → Instances
2. Select your instance
3. Look at **"Key pair name"** in details
4. If it's NOT "monkeysurvey", you need that key file

### Verify Security Group
1. AWS Console → EC2 → Security Groups
2. Find your instance's security group
3. Check **Inbound rules** has:
   - Type: SSH
   - Port: 22
   - Source: 0.0.0.0/0 (or your IP)

### Test SSH Connection
```powershell
ssh -i monkeysurvey.pem ubuntu@13.49.231.22
```

If this works, you can run:
```powershell
ssh -i monkeysurvey.pem ubuntu@13.49.231.22 "cd BodhaSurvey && git pull origin main && sudo docker compose down && sudo docker compose up -d --build"
```

## What's Been Deployed

### New Features
1. **Phone Number Login**
   - Users login with 10-digit phone number instead of email
   - Backend validates phone number via MSRUser lookup

2. **Offline Survey Mode**
   - Surveys saved to localStorage when offline
   - Auto-sync when internet returns
   - Alert notifications for offline/online status

3. **Safari iOS Fix**
   - Vite server configured for network access
   - Works on mobile devices on same network

### Files Changed
- `frontend/src/pages/Login.jsx` - Phone number input
- `frontend/src/pages/Register.jsx` - Required phone field
- `frontend/src/pages/TakeSurvey.jsx` - Offline detection & storage
- `frontend/src/App.jsx` - Auto-sync on reconnect
- `frontend/vite.config.js` - Network access enabled
- `backend/user-service/routes/users.js` - Phone login logic
- `backend/shared/validation.js` - Updated login schema

## Need Help?

If deployment fails or you see errors, check:
1. Docker logs: `sudo docker compose logs -f`
2. Specific service: `sudo docker compose logs -f frontend`
3. Container status: `sudo docker compose ps`

## Quick Commands Reference

```bash
# Check running containers
sudo docker compose ps

# View logs
sudo docker compose logs -f

# Restart specific service
sudo docker compose restart frontend

# Full rebuild
sudo docker compose down
sudo docker compose up -d --build

# Check if services are responding
curl http://localhost:3000/health  # API Gateway
curl http://localhost:80           # Frontend
```
