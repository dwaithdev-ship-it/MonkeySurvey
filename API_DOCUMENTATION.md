# BodhaSurvey - API Documentation

Base URL: `https://api.monkeysurvey.com/v1`

## Authentication

All API requests (except registration and login) require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## User Service API

### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "creator"
    }
  }
}
```

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "creator",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "settings": {
    "notifications": true,
    "language": "en"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

## Survey Service API

### Create Survey
```http
POST /surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our services",
  "category": "customer_feedback",
  "settings": {
    "anonymous": false,
    "multipleSubmissions": false,
    "requireLogin": true
  },
  "questions": [
    {
      "type": "rating",
      "question": "How satisfied are you with our service?",
      "required": true,
      "validation": {
        "min": 1,
        "max": 5
      }
    },
    {
      "type": "textarea",
      "question": "What can we improve?",
      "required": false
    }
  ]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "surveyId": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "status": "draft",
    "shareUrl": "https://survey.monkeysurvey.com/s/507f1f77bcf86cd799439012"
  }
}
```

### Get All Surveys
```http
GET /surveys?status=active&page=1&limit=10
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Customer Satisfaction Survey",
        "status": "active",
        "responseCount": 45,
        "completionRate": 0.87,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 23,
      "pages": 3
    }
  }
}
```

### Get Survey by ID
```http
GET /surveys/:surveyId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our services",
    "status": "active",
    "questions": [
      {
        "id": "507f1f77bcf86cd799439013",
        "type": "rating",
        "question": "How satisfied are you with our service?",
        "required": true,
        "order": 1
      }
    ],
    "responseCount": 45,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Survey
```http
PUT /surveys/:surveyId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Survey Title",
  "status": "active"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Updated Survey Title",
    "status": "active"
  }
}
```

### Delete Survey
```http
DELETE /surveys/:surveyId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Survey deleted successfully"
}
```

### Publish Survey
```http
POST /surveys/:surveyId/publish
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "active",
    "shareUrl": "https://survey.monkeysurvey.com/s/507f1f77bcf86cd799439012"
  }
}
```

### Get Survey Templates
```http
GET /surveys/templates?category=customer_feedback
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "507f1f77bcf86cd799439014",
        "name": "Customer Feedback Template",
        "description": "Collect customer feedback",
        "category": "customer_feedback",
        "thumbnail": "https://cdn.monkeysurvey.com/templates/customer.png",
        "questionCount": 8
      }
    ]
  }
}
```

## Response Service API

### Submit Response
```http
POST /responses
Content-Type: application/json

{
  "surveyId": "507f1f77bcf86cd799439012",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439013",
      "value": 5
    },
    {
      "questionId": "507f1f77bcf86cd799439014",
      "value": "Great service!"
    }
  ]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "responseId": "507f1f77bcf86cd799439015",
    "surveyId": "507f1f77bcf86cd799439012",
    "status": "complete",
    "submittedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Save Partial Response
```http
POST /responses/partial
Authorization: Bearer <token>
Content-Type: application/json

{
  "surveyId": "507f1f77bcf86cd799439012",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439013",
      "value": 5
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "responseId": "507f1f77bcf86cd799439015",
    "status": "incomplete"
  }
}
```

### Get Survey Responses
```http
GET /responses?surveyId=507f1f77bcf86cd799439012&page=1&limit=50
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "responses": [
      {
        "id": "507f1f77bcf86cd799439015",
        "surveyId": "507f1f77bcf86cd799439012",
        "completedAt": "2024-01-01T12:00:00.000Z",
        "answers": [
          {
            "questionId": "507f1f77bcf86cd799439013",
            "value": 5
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45
    }
  }
}
```

## Analytics Service API

### Get Survey Analytics
```http
GET /analytics/surveys/:surveyId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "surveyId": "507f1f77bcf86cd799439012",
    "totalResponses": 45,
    "completionRate": 0.87,
    "averageTimeToComplete": 180,
    "responseRate": {
      "daily": [
        { "date": "2024-01-01", "count": 12 },
        { "date": "2024-01-02", "count": 15 }
      ]
    },
    "demographics": {
      "byCountry": [
        { "country": "USA", "count": 25 },
        { "country": "UK", "count": 20 }
      ],
      "byDevice": [
        { "device": "mobile", "count": 30 },
        { "device": "desktop", "count": 15 }
      ]
    }
  }
}
```

### Get Question Analytics
```http
GET /analytics/questions/:questionId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "questionId": "507f1f77bcf86cd799439013",
    "question": "How satisfied are you with our service?",
    "type": "rating",
    "totalResponses": 45,
    "statistics": {
      "average": 4.2,
      "median": 5,
      "mode": 5,
      "standardDeviation": 0.8
    },
    "distribution": [
      { "value": 1, "count": 1, "percentage": 2.2 },
      { "value": 2, "count": 2, "percentage": 4.4 },
      { "value": 3, "count": 5, "percentage": 11.1 },
      { "value": 4, "count": 15, "percentage": 33.3 },
      { "value": 5, "count": 22, "percentage": 48.9 }
    ]
  }
}
```

### Create Custom Report Query
```http
POST /analytics/reports/custom
Authorization: Bearer <token>
Content-Type: application/json

{
  "surveyId": "507f1f77bcf86cd799439012",
  "queryName": "High Satisfaction Customers",
  "filters": {
    "questions": [
      {
        "questionId": "507f1f77bcf86cd799439013",
        "operator": "greaterThan",
        "value": 4
      }
    ],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "fields": ["respondentId", "completedAt", "location.country"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "queryId": "507f1f77bcf86cd799439016",
    "results": [
      {
        "respondentId": "507f1f77bcf86cd799439011",
        "completedAt": "2024-01-01T12:00:00.000Z",
        "country": "USA"
      }
    ],
    "totalResults": 35
  }
}
```

### Export Survey Data
```http
POST /analytics/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "surveyId": "507f1f77bcf86cd799439012",
  "format": "csv",
  "includeMetadata": true,
  "filters": {
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "downloadUrl": "https://exports.monkeysurvey.com/files/export-12345.csv",
    "expiresAt": "2024-01-01T13:00:00.000Z",
    "fileSize": 245678
  }
}
```

### Get Dashboard Summary
```http
GET /analytics/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "totalSurveys": 12,
    "activeSurveys": 5,
    "totalResponses": 1234,
    "responsesThisMonth": 234,
    "recentActivity": [
      {
        "type": "response_submitted",
        "surveyTitle": "Customer Satisfaction Survey",
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "topSurveys": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Customer Satisfaction Survey",
        "responseCount": 45
      }
    ]
  }
}
```

## Notification Service API

### Send Survey Invitation
```http
POST /notifications/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "surveyId": "507f1f77bcf86cd799439012",
  "recipients": ["email1@example.com", "email2@example.com"],
  "message": "We'd love your feedback!",
  "scheduleAt": "2024-01-02T09:00:00.000Z"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "invitationId": "507f1f77bcf86cd799439017",
    "recipientCount": 2,
    "status": "scheduled"
  }
}
```

### Get Notification Settings
```http
GET /notifications/settings
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "email": true,
    "push": true,
    "frequency": "immediate",
    "types": {
      "newResponse": true,
      "surveyComplete": true,
      "weeklyReport": false
    }
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): User doesn't have permission
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for anonymous users

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```
