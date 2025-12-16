# MonkeySurvey - Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 16+ (for local development)
- MongoDB 6+
- PostgreSQL 14+
- Redis 7+

## Environment Setup

### Backend Services

Each microservice requires a `.env` file. Copy `.env.example` to `.env` and configure:

#### User Service (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

#### Survey Service (.env)
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
NODE_ENV=production
```

#### Response Service (.env)
```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
NODE_ENV=production
```

#### Analytics Service (.env)
```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
POSTGRES_URI=postgresql://user:password@localhost:5432/monkeysurvey_analytics
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

#### Notification Service (.env)
```env
PORT=3005
MONGODB_URI=mongodb://localhost:27017/monkeysurvey
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
NODE_ENV=production
```

### Mobile App

Update `mobile/src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-production-domain.com/v1';
```

## Docker Deployment

### 1. Build Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build user-service
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d mongodb postgres redis
docker-compose up -d user-service survey-service
```

### 3. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service
```

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace monkeysurvey
```

### 2. Create Secrets

```bash
# Create JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET=your-production-secret \
  -n monkeysurvey

# Create database credentials
kubectl create secret generic db-credentials \
  --from-literal=MONGODB_URI=mongodb://user:pass@mongodb:27017/monkeysurvey \
  --from-literal=POSTGRES_URI=postgresql://user:pass@postgres:5432/analytics \
  -n monkeysurvey
```

### 3. Apply Configurations

```bash
# Apply all configurations
kubectl apply -f k8s/ -n monkeysurvey

# Apply specific configurations
kubectl apply -f k8s/mongodb.yaml -n monkeysurvey
kubectl apply -f k8s/user-service.yaml -n monkeysurvey
```

### 4. Check Status

```bash
# Check pods
kubectl get pods -n monkeysurvey

# Check services
kubectl get services -n monkeysurvey

# Check logs
kubectl logs -f deployment/user-service -n monkeysurvey
```

## Database Setup

### MongoDB

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/monkeysurvey

# Create indexes
use monkeysurvey
db.users.createIndex({ email: 1 }, { unique: true })
db.surveys.createIndex({ createdBy: 1 })
db.responses.createIndex({ surveyId: 1 })
```

### PostgreSQL

```bash
# Connect to PostgreSQL
psql -U postgres -d monkeysurvey_analytics

# Run migrations
psql -U postgres -d monkeysurvey_analytics < database/postgres-schema.sql
```

## Mobile App Deployment

### iOS

1. **Update Configuration**
   ```bash
   cd mobile/ios
   pod install
   ```

2. **Build for Release**
   ```bash
   # Open Xcode
   open ios/MonkeySurveyMobile.xcworkspace
   
   # In Xcode:
   # - Select Generic iOS Device
   # - Product > Archive
   # - Distribute App > App Store Connect
   ```

3. **Upload to App Store**
   - Use Xcode organizer or App Store Connect

### Android

1. **Generate Signing Key**
   ```bash
   cd mobile/android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore monkeysurvey.keystore \
     -alias monkeysurvey -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Build Release APK**
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   
   # APK location: android/app/build/outputs/apk/release/app-release.apk
   ```

3. **Build App Bundle (for Play Store)**
   ```bash
   ./gradlew bundleRelease
   
   # AAB location: android/app/build/outputs/bundle/release/app-release.aab
   ```

4. **Upload to Google Play Console**
   - Go to Google Play Console
   - Upload the AAB file
   - Complete the release checklist

## CI/CD Pipeline

### GitHub Actions

The repository includes GitHub Actions workflows for:

- **Backend Services**: Automated testing and deployment
- **Mobile App**: Build and distribute to App Store/Play Store

Workflow files are in `.github/workflows/`:
- `backend-ci.yml` - Backend CI/CD
- `mobile-ios.yml` - iOS build and deployment
- `mobile-android.yml` - Android build and deployment

### Setup Secrets

In GitHub repository settings, add:

```
# Docker Hub
DOCKER_USERNAME
DOCKER_PASSWORD

# Kubernetes
KUBE_CONFIG

# Mobile
APPLE_ID
APPLE_PASSWORD
ANDROID_KEYSTORE_BASE64
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

## Monitoring & Logging

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'monkeysurvey'
    static_configs:
      - targets: ['user-service:3001', 'survey-service:3002']
```

### Grafana

1. Access Grafana: http://localhost:3000
2. Add Prometheus data source
3. Import MonkeySurvey dashboard

### ELK Stack

```bash
# Start ELK stack
docker-compose -f docker-compose.elk.yml up -d

# Access Kibana
http://localhost:5601
```

## Backup & Recovery

### MongoDB Backup

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/monkeysurvey" --out=/backup/mongodb/

# Restore
mongorestore --uri="mongodb://localhost:27017/monkeysurvey" /backup/mongodb/monkeysurvey/
```

### PostgreSQL Backup

```bash
# Backup
pg_dump -U postgres monkeysurvey_analytics > backup.sql

# Restore
psql -U postgres monkeysurvey_analytics < backup.sql
```

## Scaling

### Horizontal Scaling

```bash
# Scale user service to 3 replicas
kubectl scale deployment user-service --replicas=3 -n monkeysurvey

# Auto-scaling based on CPU
kubectl autoscale deployment user-service \
  --min=2 --max=10 --cpu-percent=70 -n monkeysurvey
```

### Database Scaling

#### MongoDB Replica Set

```yaml
# docker-compose.yml
mongodb-primary:
  image: mongo:6
  command: --replSet rs0

mongodb-secondary:
  image: mongo:6
  command: --replSet rs0
```

#### PostgreSQL Read Replicas

```yaml
postgres-primary:
  image: postgres:14
  environment:
    POSTGRES_REPLICATION_MODE: master

postgres-replica:
  image: postgres:14
  environment:
    POSTGRES_REPLICATION_MODE: slave
```

## Security

### SSL/TLS

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt
```

### Rate Limiting

Configured in each service with `express-rate-limit`:
- 100 requests/minute for authenticated users
- 20 requests/minute for anonymous users

### CORS

Configure allowed origins in each service:
```javascript
app.use(cors({
  origin: ['https://app.monkeysurvey.com', 'https://monkeysurvey.com'],
  credentials: true
}));
```

## Troubleshooting

### Service Not Starting

```bash
# Check logs
docker-compose logs service-name

# Check health
curl http://localhost:3001/health
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/monkeysurvey

# Test PostgreSQL connection
psql -U postgres -d monkeysurvey_analytics
```

### Mobile App Build Issues

```bash
# Clear caches
cd mobile
rm -rf node_modules
npm install

# iOS
cd ios
pod deintegrate
pod install

# Android
cd android
./gradlew clean
```

## Support

For issues or questions:
- Documentation: https://docs.monkeysurvey.com
- Email: support@monkeysurvey.com
- GitHub Issues: https://github.com/your-org/MonkeySurvey/issues
