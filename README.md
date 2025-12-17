# MonkeySurvey 📊

A comprehensive mobile survey application with beautiful UI design, robust microservices architecture, and powerful analytics dashboard.

## 🚀 Features

### Core Features
- **Web Application**: Full-featured React web app with user and admin interfaces
- **Create Surveys**: Easy-to-use survey builder with multiple question types
- **Take Surveys**: Smooth, responsive survey-taking experience
- **Admin Panel**: Manage surveys, questions, and view responses
- **User Authentication**: Secure JWT-based authentication
- **Mobile Apps**: Native Android (Kotlin) and iOS (Swift) support
- **RESTful APIs**: Complete backend microservices architecture

### Question Types
- Multiple Choice (single selection)
- Checkboxes (multiple selections)
- Short Text Input
- Long Text Area
- Rating Scale (1-5 stars)
- Dropdown Selection

### Admin Capabilities
- Survey creation and management
- Dynamic question builder (add/edit/delete/reorder)
- Publish/unpublish surveys
- View response counts
- Manage survey settings
- Role-based access control

## 🏗️ Architecture

### Microservices
1. **User Service** (Port 3001) - Authentication and user management ✅
2. **Survey Service** (Port 3002) - Survey creation and management ✅
3. **Response Service** (Port 3003) - Survey response handling ✅
4. **Analytics Service** (Port 3004) - Analytics and reporting (planned)
5. **Notification Service** (Port 3005) - Email and push notifications (planned)
6. **API Gateway** (Port 3000) - Single entry point (planned)

### Technology Stack

#### Backend
- Node.js with Express
- MongoDB for survey data
- PostgreSQL for analytics
- Redis for caching
- JWT authentication

#### Web Frontend
- React 18 with React Router
- Context API for state management
- Responsive design
- Axios for API calls

#### Mobile (Native)
- **Android**: Kotlin + Jetpack Compose (structure provided)
- **iOS**: Swift + SwiftUI (structure provided)
- Complete setup guides included

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes! ⚡
- **[Setup Guide](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What's implemented and how to use it

### Technical Documentation
- [Architecture Overview](ARCHITECTURE.md) - System design and microservices
- [Database Schema](DATABASE_SCHEMA.md) - Data models and relationships
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [UI Design Guide](UI_DESIGN.md) - Design system and components
- [Deployment Guide](DEPLOYMENT.md) - Production deployment

### Platform-Specific
- [Android Setup](android/README.md) - Native Android app guide
- [iOS Setup](ios/README.md) - Native iOS app guide

## 🚀 Quick Start

**Want to get started immediately?** See the **[Quick Start Guide](QUICK_START.md)** for a 5-minute setup!

### Prerequisites
- Node.js 16+
- MongoDB (via Docker or local installation)

### Minimal Setup

1. **Start MongoDB**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Setup Database**
   ```bash
   cd database
   mongosh < migrations/001_initial_setup.js
   ```

3. **Start Backend Services**
   ```bash
   # Terminal 1 - User Service
   cd backend/user-service
   npm install && npm start

   # Terminal 2 - Survey Service  
   cd backend/survey-service
   npm install && npm start

   # Terminal 3 - Response Service
   cd backend/response-service
   npm install && npm start
   ```

4. **Start Web Frontend**
   ```bash
   cd web/frontend
   npm install
   npm start
   ```

5. **Access the Application**
   - Open http://localhost:3000
   - Login with: admin@monkeysurvey.com / admin123

For detailed instructions including mobile app setup, see:
- [Quick Start Guide](QUICK_START.md) - 5-minute setup
- [Setup Guide](SETUP_GUIDE.md) - Comprehensive guide
- [Android Setup](android/README.md) - Native Android app
- [iOS Setup](ios/README.md) - Native iOS app

## 🔌 API Endpoints

### User Service
- `POST /users/register` - Register new user
- `POST /users/login` - Login user
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Survey Service
- `POST /surveys` - Create survey
- `GET /surveys` - List surveys
- `GET /surveys/:id` - Get survey details
- `PUT /surveys/:id` - Update survey
- `DELETE /surveys/:id` - Delete survey
- `POST /surveys/:id/publish` - Publish survey

### Response Service
- `POST /responses` - Submit survey response
- `POST /responses/partial` - Save partial response
- `GET /responses?surveyId=:id` - Get responses

### Analytics Service
- `GET /analytics/surveys/:id` - Get survey analytics
- `GET /analytics/questions/:id` - Get question analytics
- `POST /analytics/reports/custom` - Create custom report
- `POST /analytics/export` - Export data
- `GET /analytics/dashboard` - Get dashboard summary

## 📊 Database Schema

### MongoDB Collections
- **users** - User accounts and profiles
- **surveys** - Survey definitions and settings
- **questions** - Individual survey questions
- **responses** - Survey responses and answers
- **templates** - Survey templates

### PostgreSQL Tables
- **analytics_cache** - Cached analytics data
- **report_queries** - Saved custom queries
- **user_activity_logs** - Activity tracking

## 🎨 UI Design

The app features a modern, clean design with:
- **Color Palette**: Indigo primary, Emerald success, Amber warning
- **Typography**: Inter/SF Pro for clarity
- **Components**: Cards, buttons, inputs, charts
- **Navigation**: Bottom tabs with intuitive icons
- **Animations**: Smooth transitions and feedback

See [UI_DESIGN.md](UI_DESIGN.md) for complete design specifications.

## 🔒 Security

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- API rate limiting
- Input validation with Joi
- HTTPS encryption
- CORS configuration

## 📈 Scaling

The microservices architecture allows for:
- Horizontal scaling of individual services
- MongoDB replica sets
- PostgreSQL read replicas
- Redis caching layer
- Kubernetes orchestration
- Auto-scaling based on load

## 🧪 Testing

```bash
# Run backend tests
cd backend/user-service
npm test

# Run mobile tests
cd mobile
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

MonkeySurvey Team

## 📧 Support

- Email: support@monkeysurvey.com
- Documentation: https://docs.monkeysurvey.com
- Issues: https://github.com/dwaithdev-ship-it/MonkeySurvey/issues
