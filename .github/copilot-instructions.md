# MonkeySurvey AI Coding Agent Instructions

## Project Overview
MonkeySurvey is a microservices-based mobile survey application with a React Native frontend, Node.js backend services, and comprehensive analytics. The system uses MongoDB for survey data and PostgreSQL for analytics aggregation.

## Architecture Essentials

### Microservices Structure
Six independent Node.js services communicate through an API Gateway (port 3000):
- **user-service** (3001): JWT auth with bcrypt, user profiles
- **survey-service** (3002): MongoDB-backed survey CRUD with nested questions schema
- **response-service** (3003): Handles survey submissions and partial saves
- **analytics-service** (3004): Mock analytics endpoints (PostgreSQL integration pending)
- **notification-service** (3005): Email and push notifications
- **api-gateway** (3000): Request routing, rate limiting (100 req/min)

All services follow identical structure: `server.js` → Express setup → `routes/` → route handlers. See [backend/survey-service/server.js](backend/survey-service/server.js) as reference.

### Data Models
Surveys use embedded questions (not references) in MongoDB schema - see [backend/survey-service/models/Survey.js](backend/survey-service/models/Survey.js). Questions schema supports 9 types (multiple_choice, checkbox, text, textarea, rating, scale, date, dropdown, matrix) with validation rules and conditional logic.

### Shared Utilities
[backend/shared/](backend/shared/) contains auth helpers (`generateToken`, `verifyToken`, `authMiddleware`) and Joi validation schemas reused across services. Import from shared module, not duplicated code.

## Critical Developer Workflows

### Running Services Locally
```bash
# Start databases first (required)
docker-compose up -d mongodb postgres redis

# Each service needs .env with MONGODB_URI and JWT_SECRET
cd backend/user-service
npm install
npm start  # Runs on port 3001
```

Services expect MongoDB at `mongodb://localhost:27017/monkeysurvey` by default. No auto-migration scripts - manually ensure DB is running.

### Mobile Development
Mobile app uses Redux Toolkit with three slices: `authSlice`, `surveySlice`, `analyticsSlice`. API client in [mobile/src/services/api.js](mobile/src/services/api.js) uses Axios with automatic JWT token injection from AsyncStorage. API base URL is hardcoded to `https://api.monkeysurvey.com/v1` - change for local dev.

Frontend (Vite + React) is currently a default template - not integrated with backend yet.

## Project-Specific Conventions

### Error Response Format
All services use standardized error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```
Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`

### Authentication Pattern
JWT tokens expire in 7 days. Middleware pattern from [backend/shared/auth.js](backend/shared/auth.js) expects `Authorization: Bearer <token>` header. All protected routes use `authMiddleware` - decoded user available as `req.user`.

### Validation Pattern
Use Joi schemas from [backend/shared/validation.js](backend/shared/validation.js) with `validate(schema)` middleware. Returns 400 with field-level errors on validation failure. Example: `router.post('/surveys', validate(surveySchema), handler)`

## Key Integration Points

### Service Communication
Services don't directly call each other - all routing through API Gateway (not yet implemented). Gateway should proxy to service URLs from env vars: `USER_SERVICE_URL=http://user-service:3001`.

### Database Connections
MongoDB connection in each service's `server.js` - exits on failure. No connection pooling config. PostgreSQL only used in analytics-service (currently mock data).

### Docker Networking
[docker-compose.yml](docker-compose.yml) creates `monkeysurvey-network`. Services reference each other by container name (e.g., `mongodb:27017`). Production builds use multi-stage Dockerfiles in each service directory.

## Known Gaps & Status
- Analytics service returns mock data - PostgreSQL schema defined in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) but not implemented
- API Gateway exists but only routes defined, no actual proxying logic
- Frontend is default Vite template, not connected to backend
- No test suite or CI/CD configured yet
- Response service basic structure only - no actual DB operations

## Documentation Reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - Full system design
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete MongoDB/PostgreSQL schemas with indexes
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - All 50+ endpoints with request/response examples
- [UI_DESIGN.md](UI_DESIGN.md) - Design system, screen layouts, component specs
