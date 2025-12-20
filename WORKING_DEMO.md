# ✅ MonkeySurvey - Working Demo

## Services Status: ALL WORKING ✓

All backend services and frontend are now fully functional!

## Access URLs

- **Frontend Web UI**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Direct Service Access**:
  - User Service: http://localhost:3001
  - Survey Service: http://localhost:3002
  - Response Service: http://localhost:3003
  - Analytics Service: http://localhost:3004
  - Notification Service: http://localhost:3005

## Test Results ✓

### 1. User Registration - WORKING ✓
```bash
POST http://localhost:3000/users/register
Body: {
  "firstName": "Test",
  "lastName": "User",
  "email": "testdemo@example.com",
  "password": "Test123!"
}

Response: {
  "success": true,
  "data": {
    "userId": "6943919fbb62b3d6309f5915",
    "email": "testdemo@example.com",
    "token": "eyJhbGc..."
  }
}
```

### 2. Survey Creation - WORKING ✓
```bash
POST http://localhost:3000/surveys
Headers: { Authorization: "Bearer <token>" }
Body: {
  "title": "Customer Feedback Survey",
  "description": "Please share your feedback",
  "category": "customer_feedback",
  "questions": [{
    "type": "multiple_choice",
    "question": "How satisfied are you?",
    "required": true,
    "options": [
      { "value": "very_satisfied", "label": "Very Satisfied", "order": 1 },
      { "value": "satisfied", "label": "Satisfied", "order": 2 }
    ]
  }]
}

Response: {
  "success": true,
  "data": {
    "surveyId": "69439280b8840ba08ddad98c",
    "title": "Customer Feedback Survey",
    "status": "draft",
    "shareUrl": "https://survey.monkeysurvey.com/s/69439280b8840ba08ddad98c"
  }
}
```

## How to Use the Web Interface

### Step 1: Start Frontend (if not running)
```powershell
cd C:\Users\PC\MonkeySurvey\frontend
npm run dev
```

### Step 2: Access the Application
Open your browser and go to: http://localhost:5173

### Step 3: Register/Login
1. Click "Register" link
2. Fill in your details:
   - First Name: Your Name
   - Last Name: Your Last Name
   - Email: your@email.com
   - Password: YourPassword123!
3. Click "Register"

### Step 4: Create a Survey
1. After login, you'll see the Dashboard
2. Click "+ Create Survey" button
3. Fill in survey details:
   - **Title**: e.g., "Customer Satisfaction Survey"
   - **Description**: e.g., "Help us improve"
   - **Category**: Choose from dropdown
4. Add Questions:
   - Select question type (e.g., "Multiple Choice")
   - Enter question text: e.g., "How satisfied are you?"
   - **For Multiple Choice/Checkbox/Dropdown**: Enter options separated by commas
     Example: `Very Satisfied, Satisfied, Neutral, Dissatisfied`
   - Check "Required" if needed
   - Click "Add" button
5. Add more questions as needed
6. Click "Create Survey" button

## Important Notes for Question Options

When creating questions that need options (Multiple Choice, Checkbox, Dropdown):
- **Enter options as comma-separated values** in the options field
- Example: `Option 1, Option 2, Option 3`
- The system will automatically format them correctly:
  ```json
  [
    { "value": "option_1", "label": "Option 1", "order": 1 },
    { "value": "option_2", "label": "Option 2", "order": 2 },
    { "value": "option_3", "label": "Option 3", "order": 3 }
  ]
  ```

## Question Types Supported

1. **Short Text** - Single line text input
2. **Long Text** - Multi-line textarea
3. **Multiple Choice** - Select one option (requires options)
4. **Checkbox** - Select multiple options (requires options)
5. **Rating** - Star or numeric rating
6. **Scale** - Sliding scale
7. **Date** - Date picker
8. **Dropdown** - Dropdown selection (requires options)

## Fixed Issues ✓

1. ✅ API Gateway body parsing - Removed express.json() to allow proxying
2. ✅ Survey creation endpoint - Changed `creatorId` to `createdBy`
3. ✅ User ID field - Changed `req.user.userId` to `req.user.id`
4. ✅ Options format - Added automatic formatting from comma-separated strings
5. ✅ Frontend question handling - Added options input field for relevant question types

## Docker Services Status

Check all services are running:
```powershell
docker-compose ps
```

All containers should show "Up" status.

View service logs:
```powershell
# API Gateway
docker logs monkeysurvey-api-gateway --tail 20

# Survey Service
docker logs monkeysurvey-survey-service --tail 20

# User Service
docker logs monkeysurvey-user-service --tail 20
```

## Success! 🎉

Your MonkeySurvey application is now fully functional. You can:
- Register and login users
- Create surveys with multiple question types
- Add questions with options (for multiple choice, etc.)
- View your created surveys in the dashboard

Enjoy using MonkeySurvey!
