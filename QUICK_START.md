# BodhaSurvey - Quick Start Guide

Get BodhaSurvey running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- MongoDB running (either locally or via Docker)

## Step-by-Step Setup

### 1. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: Local MongoDB**
```bash
mongod --dbpath /path/to/data
```

### 2. Setup Database

```bash
cd database
mongosh < migrations/001_initial_setup.js
```

### 3. Install Backend Dependencies

Install shared package first:
```bash
cd backend/shared
npm install
```

Install all service dependencies:
```bash
# User Service
cd ../user-service
npm install
cp .env.example .env

# Survey Service
cd ../survey-service
npm install
cp .env.example .env

# Response Service
cd ../response-service
npm install
cp .env.example .env
```

### 4. Start Backend Services

Open 3 terminal windows and run:

**Terminal 1 - User Service:**
```bash
cd backend/user-service
npm start
```

**Terminal 2 - Survey Service:**
```bash
cd backend/survey-service
npm start
```

**Terminal 3 - Response Service:**
```bash
cd backend/response-service
npm start
```

### 5. Start Web Frontend

Open a new terminal:
```bash
cd web/frontend
npm install
cp .env.example .env
npm start
```

### 6. Access the Application

Open your browser and go to:
```
http://localhost:3000
```

### 7. Login with Default Admin

- **Email**: admin@monkeysurvey.com
- **Password**: admin123

⚠️ **Important**: Change this password after first login!

## Verify Everything is Running

You should see these services running:

- ✅ MongoDB: `mongodb://localhost:27017`
- ✅ User Service: `http://localhost:3001`
- ✅ Survey Service: `http://localhost:3002`
- ✅ Response Service: `http://localhost:3003`
- ✅ Web Frontend: `http://localhost:3000`

Test the health endpoints:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## Quick Commands

### Stop All Services

Press `Ctrl+C` in each terminal window.

### Restart Services

Just rerun the `npm start` command in each service directory.

### View Logs

Logs appear in the terminal where each service is running.

### Check MongoDB

```bash
mongosh
use monkeysurvey
db.users.find()
db.surveys.find()
```

## Common Issues & Solutions

### Port Already in Use

If you see "port already in use" error:

```bash
# Find what's using the port (example for port 3001)
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Error

1. Check MongoDB is running: `mongosh`
2. Verify connection string in `.env` files
3. Restart MongoDB

### npm install Errors

Try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Start

1. Check all backend services are running
2. Verify `.env` file exists in `web/frontend/`
3. Try clearing cache: `npm start -- --reset-cache`

## What's Next?

### Create Your First Survey

1. Login as admin
2. Go to Admin Panel
3. Click "Create Survey"
4. Add title, description, and questions
5. Save and publish

### Take a Survey

1. Logout or open incognito window
2. Go to Survey List
3. Select your survey
4. Fill it out and submit

### View Results

1. Login as admin
2. Go to Admin Panel
3. View survey statistics

## Development Mode

For hot-reload during development:

```bash
# Backend services (in each service directory)
npm run dev

# Frontend
npm start
```

## Production Deployment

See `DEPLOYMENT.md` for production setup.

## Need Help?

- 📖 Full documentation: `SETUP_GUIDE.md`
- 🔧 Troubleshooting: `SETUP_GUIDE.md` (Troubleshooting section)
- 📋 Implementation details: `IMPLEMENTATION_SUMMARY.md`
- 🐛 Report issues: GitHub Issues

## Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       v
┌─────────────┐
│   React     │
│  Frontend   │
│  (Port 3000)│
└──────┬──────┘
       │
       v
┌─────────────────────────────────┐
│     Backend Microservices       │
├─────────────┬─────────────┬─────┤
│    User     │   Survey    │Response│
│  Service    │  Service    │Service │
│ (Port 3001) │(Port 3002)  │(3003)  │
└──────┬──────┴──────┬──────┴────┬──┘
       │             │            │
       └─────────────┼────────────┘
                     │
              ┌──────┴──────┐
              │  MongoDB    │
              │(Port 27017) │
              └─────────────┘
```

## Test the Application

### Create Test User

```bash
# Register via API
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Create Test Survey

1. Login to admin panel
2. Create a survey with sample questions
3. Publish it
4. Test taking the survey

## Mobile Apps (Optional)

To set up native mobile apps:

### Android
See `android/README.md` for setup instructions.

### iOS  
See `ios/README.md` for setup instructions.

## Success! 🎉

You're now ready to:
- ✅ Create surveys
- ✅ Collect responses
- ✅ Manage surveys via admin panel
- ✅ Start building features

Happy surveying! 📊
