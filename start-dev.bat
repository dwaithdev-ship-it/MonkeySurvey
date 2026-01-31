@echo off
echo Starting BodhaSurvey Development Environment...

start "User Service" cmd /k "cd backend\user-service && npm start"
start "Survey Service" cmd /k "cd backend\survey-service && npm start"
start "Response Service" cmd /k "cd backend\response-service && npm start"
start "API Gateway" cmd /k "cd backend\api-gateway && npm start"
start "Frontend" cmd /k "cd frontend && npm run dev -- --port 4000"

echo Services started in separate windows.
