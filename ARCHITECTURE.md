# BodhaSurvey - Architecture Overview

## Project Overview
BodhaSurvey is a comprehensive mobile survey application that allows users to create, distribute, and analyze surveys with advanced reporting capabilities.

## Technology Stack

### Backend (Microservices)
- **Language**: Node.js with Express
- **Database**: MongoDB for survey data, PostgreSQL for analytics
- **API Gateway**: NGINX or Kong
- **Authentication**: JWT-based authentication
- **Caching**: Redis

### Frontend (Mobile)
- **Framework**: React Native
- **State Management**: Redux Toolkit
- **UI Library**: React Native Paper / Native Base
- **Navigation**: React Navigation

## Microservices Architecture

### 1. API Gateway (Port: 3000)
- Single entry point for all client requests
- Request routing to appropriate microservices
- Rate limiting and authentication

### 2. User Service (Port: 3001)
- User registration and authentication
- Profile management
- User roles and permissions

### 3. Survey Service (Port: 3002)
- Create, update, delete surveys
- Survey templates
- Question bank management
- Survey versioning

### 4. Response Service (Port: 3003)
- Submit survey responses
- Response validation
- Partial response handling
- Response storage

### 5. Analytics Service (Port: 3004)
- Generate reports
- Statistical analysis
- Custom queries
- Data export (CSV, PDF, Excel)

### 6. Notification Service (Port: 3005)
- Email notifications
- Push notifications
- Survey reminders

## Database Schema

### MongoDB Collections
1. **users**
2. **surveys**
3. **questions**
4. **responses**
5. **templates**

### PostgreSQL Tables
1. **analytics_cache**
2. **report_queries**
3. **user_activity_logs**

## Security
- JWT token-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- HTTPS encryption

## Deployment
- Docker containers for each microservice
- Kubernetes orchestration
- CI/CD pipeline with GitHub Actions
- Monitoring with Prometheus and Grafana
