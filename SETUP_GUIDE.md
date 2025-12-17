# MonkeySurvey - Setup Guide

This guide will help you set up and run the complete MonkeySurvey application.

## Prerequisites

### Backend
- Node.js 16.x or higher
- MongoDB 6.0 or higher
- npm or yarn

### Web Frontend
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 16.x or higher

### Android (Optional)
- Android Studio Arctic Fox or newer
- JDK 11 or higher
- Android SDK (API Level 24+)

### iOS (Optional)
- macOS with Xcode 15.0 or newer
- iOS 16.0+ SDK

## Quick Start

### 1. Database Setup

Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using local MongoDB installation
mongod --dbpath /path/to/data
```

Run database migrations:
```bash
cd database
./setup.sh
```

### 2. Backend Services

Each microservice needs to be started separately.

#### Shared Dependencies

Install shared package first:
```bash
cd backend/shared
npm install
```

#### User Service (Port 3001)

```bash
cd backend/user-service
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

#### Survey Service (Port 3002)

```bash
cd backend/survey-service
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

#### Response Service (Port 3003)

```bash
cd backend/response-service
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

### 3. Web Frontend (Port 3000)

```bash
cd web/frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL to your API gateway URL
npm start
```

The web application will open at `http://localhost:3000`

### 4. Native Mobile Apps (Optional)

#### Android App

1. Open Android Studio
2. Open the `android/` directory as a project
3. Sync Gradle files
4. Update API base URL in the code
5. Run the app on emulator or device

See `android/README.md` for detailed instructions.

#### iOS App

1. Open Xcode
2. Open the `ios/` project
3. Update API base URL in the code
4. Select a simulator or device
5. Build and run (⌘R)

See `ios/README.md` for detailed instructions.

## Using Docker Compose

The easiest way to run all services:

```bash
docker-compose up -d
```

This will start:
- MongoDB
- User Service
- Survey Service
- Response Service

## Default Credentials

After database setup, use these credentials to login:

- **Email**: admin@monkeysurvey.com
- **Password**: admin123

**Important**: Change the default password immediately after first login!

## Environment Variables

### Backend Services

All backend services use similar environment variables:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
JWT_SECRET=your-secret-key-change-in-production
```

### Web Frontend

```env
REACT_APP_API_URL=http://localhost:3000
```

## Testing the Application

### 1. Login as Admin

1. Go to `http://localhost:3000/login`
2. Login with default credentials
3. Navigate to Dashboard

### 2. Create a Survey

1. Go to Admin Panel
2. Click "Create Survey"
3. Add survey title and description
4. Add questions with different types
5. Save the survey
6. Publish the survey

### 3. Take a Survey

1. Logout or open in incognito mode
2. Go to Survey List
3. Select a survey
4. Fill out the form
5. Submit

### 4. View Responses

1. Login as admin
2. Go to Admin Panel
3. View survey statistics and responses

## API Documentation

API endpoints are documented in `API_DOCUMENTATION.md`

Base URLs:
- User Service: `http://localhost:3001`
- Survey Service: `http://localhost:3002`
- Response Service: `http://localhost:3003`

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh --eval "db.serverStatus()"

# Restart MongoDB
docker restart mongodb
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Frontend Not Loading

```bash
# Clear node_modules and reinstall
cd web/frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### CORS Issues

Ensure backend services have CORS enabled. Check the `cors()` middleware in each service's `server.js`.

## Development

### Hot Reload

Backend services support hot reload with nodemon:
```bash
npm run dev
```

Frontend supports hot reload by default:
```bash
npm start
```

### Code Structure

```
MonkeySurvey/
├── backend/           # Backend microservices
│   ├── shared/       # Shared utilities (auth, validation)
│   ├── user-service/ # User management
│   ├── survey-service/# Survey management
│   └── response-service/ # Response handling
├── web/              # Web application
│   ├── frontend/     # React frontend
│   └── backend/      # API gateway (optional)
├── android/          # Native Android app
├── ios/              # Native iOS app
├── database/         # Database scripts
└── docs/             # Documentation
```

## Next Steps

1. ✅ Setup complete
2. 📝 Create your first survey
3. 📱 Test on mobile apps
4. 🚀 Deploy to production (see DEPLOYMENT.md)
5. 📊 Monitor usage and analytics

## Support

For issues and questions:
- GitHub Issues: https://github.com/dwaithdev-ship-it/MonkeySurvey/issues
- Email: support@monkeysurvey.com
- Documentation: See README.md and other docs

## Production Deployment

For production deployment instructions, see `DEPLOYMENT.md`.

Key considerations:
- Use environment variables for sensitive data
- Enable HTTPS
- Set up proper database backups
- Configure rate limiting
- Set up monitoring and logging
- Use process managers (PM2, systemd)
- Consider load balancing for scaling
