# MonkeySurvey 📊

A comprehensive mobile survey application with beautiful UI design, robust microservices architecture, and powerful analytics dashboard.

## 🚀 Features

### Mobile App
- **Beautiful UI**: Modern, intuitive design with React Native
- **Create Surveys**: Easy-to-use survey builder with multiple question types
- **Take Surveys**: Smooth, responsive survey-taking experience
- **Real-time Analytics**: Interactive charts and statistics
- **Custom Reports**: Build custom queries to analyze survey data
- **Export Data**: Export results to CSV, PDF, and Excel

### Question Types
- Multiple Choice
- Checkboxes
- Text Input
- Text Area
- Rating Scale (1-5 stars)
- Linear Scale
- Date Picker
- Dropdown
- Matrix Questions

### Analytics & Reporting
- Response rate tracking
- Completion rate analysis
- Question-level statistics (average, median, mode, distribution)
- Demographics breakdown (country, device type)
- Custom report builder with filters
- Data export in multiple formats
- Dashboard with key metrics

## 🏗️ Architecture

### Microservices
1. **API Gateway** (Port 3000) - Single entry point for all requests
2. **User Service** (Port 3001) - Authentication and user management
3. **Survey Service** (Port 3002) - Survey creation and management
4. **Response Service** (Port 3003) - Survey response handling
5. **Analytics Service** (Port 3004) - Analytics and reporting
6. **Notification Service** (Port 3005) - Email and push notifications

### Technology Stack

#### Backend
- Node.js with Express
- MongoDB for survey data
- PostgreSQL for analytics
- Redis for caching
- JWT authentication

#### Mobile
- React Native
- Redux Toolkit for state management
- React Native Paper for UI components
- Axios for API calls

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [API Documentation](API_DOCUMENTATION.md)
- [UI Design Guide](UI_DESIGN.md)
- [Deployment Guide](DEPLOYMENT.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- MongoDB 6+
- PostgreSQL 14+

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dwaithdev-ship-it/MonkeySurvey.git
   cd MonkeySurvey
   ```

2. **Start services with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Or run services individually**
   ```bash
   # Start databases
   docker-compose up -d mongodb postgres redis
   
   # Install dependencies
   cd backend/user-service
   npm install
   
   # Create .env file
   cp .env.example .env
   
   # Start service
   npm start
   ```

### Mobile App Setup

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **iOS Setup**
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

3. **Android Setup**
   ```bash
   npm run android
   ```

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
