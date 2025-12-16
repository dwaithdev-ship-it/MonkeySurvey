# MonkeySurvey - Database Schema

## MongoDB Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "string (unique, required)",
  "password": "string (hashed, required)",
  "firstName": "string",
  "lastName": "string",
  "role": "string (enum: ['admin', 'creator', 'respondent'])",
  "profileImage": "string (URL)",
  "createdAt": "date",
  "updatedAt": "date",
  "isActive": "boolean",
  "settings": {
    "notifications": "boolean",
    "language": "string",
    "timezone": "string"
  }
}
```

### Surveys Collection
```json
{
  "_id": "ObjectId",
  "title": "string (required)",
  "description": "string",
  "createdBy": "ObjectId (ref: users)",
  "status": "string (enum: ['draft', 'active', 'closed', 'archived'])",
  "category": "string",
  "tags": ["string"],
  "startDate": "date",
  "endDate": "date",
  "settings": {
    "anonymous": "boolean",
    "multipleSubmissions": "boolean",
    "showResults": "boolean",
    "requireLogin": "boolean",
    "randomizeQuestions": "boolean",
    "maxResponses": "number"
  },
  "branding": {
    "logo": "string (URL)",
    "primaryColor": "string",
    "backgroundColor": "string"
  },
  "questions": ["ObjectId (ref: questions)"],
  "responseCount": "number",
  "completionRate": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Questions Collection
```json
{
  "_id": "ObjectId",
  "surveyId": "ObjectId (ref: surveys)",
  "type": "string (enum: ['multiple_choice', 'checkbox', 'text', 'textarea', 'rating', 'scale', 'date', 'dropdown', 'matrix'])",
  "question": "string (required)",
  "description": "string",
  "required": "boolean",
  "order": "number",
  "options": [{
    "value": "string",
    "label": "string",
    "order": "number"
  }],
  "validation": {
    "minLength": "number",
    "maxLength": "number",
    "pattern": "string",
    "min": "number",
    "max": "number"
  },
  "logic": {
    "skipTo": "ObjectId (ref: questions)",
    "showIf": {
      "questionId": "ObjectId",
      "operator": "string (enum: ['equals', 'contains', 'greaterThan', 'lessThan'])",
      "value": "any"
    }
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Responses Collection
```json
{
  "_id": "ObjectId",
  "surveyId": "ObjectId (ref: surveys, required)",
  "respondentId": "ObjectId (ref: users, optional)",
  "sessionId": "string (for anonymous responses)",
  "status": "string (enum: ['incomplete', 'complete'])",
  "startedAt": "date",
  "completedAt": "date",
  "ipAddress": "string",
  "userAgent": "string",
  "location": {
    "country": "string",
    "city": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "answers": [{
    "questionId": "ObjectId (ref: questions)",
    "value": "any (string, number, array, object)",
    "answeredAt": "date"
  }],
  "metadata": {
    "deviceType": "string",
    "browser": "string",
    "referrer": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Templates Collection
```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "description": "string",
  "category": "string",
  "thumbnail": "string (URL)",
  "isPremium": "boolean",
  "createdBy": "ObjectId (ref: users)",
  "useCount": "number",
  "rating": "number",
  "questions": [{
    "type": "string",
    "question": "string",
    "options": ["string"],
    "required": "boolean"
  }],
  "tags": ["string"],
  "createdAt": "date",
  "updatedAt": "date"
}
```

## PostgreSQL Schema

### analytics_cache Table
```sql
CREATE TABLE analytics_cache (
  id SERIAL PRIMARY KEY,
  survey_id VARCHAR(24) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_data JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(survey_id, metric_type)
);
```

### report_queries Table
```sql
CREATE TABLE report_queries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL,
  survey_id VARCHAR(24) NOT NULL,
  query_name VARCHAR(255),
  query_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_run TIMESTAMP,
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_config JSONB
);
```

### user_activity_logs Table
```sql
CREATE TABLE user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(24),
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

### MongoDB Indexes
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Surveys
db.surveys.createIndex({ createdBy: 1 });
db.surveys.createIndex({ status: 1 });
db.surveys.createIndex({ category: 1 });
db.surveys.createIndex({ tags: 1 });
db.surveys.createIndex({ createdAt: -1 });

// Questions
db.questions.createIndex({ surveyId: 1, order: 1 });

// Responses
db.responses.createIndex({ surveyId: 1 });
db.responses.createIndex({ respondentId: 1 });
db.responses.createIndex({ completedAt: -1 });
db.responses.createIndex({ "answers.questionId": 1 });

// Templates
db.templates.createIndex({ category: 1 });
db.templates.createIndex({ tags: 1 });
```

### PostgreSQL Indexes
```sql
CREATE INDEX idx_analytics_survey ON analytics_cache(survey_id);
CREATE INDEX idx_report_queries_user ON report_queries(user_id);
CREATE INDEX idx_report_queries_survey ON report_queries(survey_id);
CREATE INDEX idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON user_activity_logs(created_at);
```
