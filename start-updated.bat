@echo off
echo Starting MonkeySurvey Development Environment (Updated)...

start "User Service" cmd /k "cd backend\user-service && npm run dev"
start "Survey Service" cmd /k "cd backend\survey-service && npm run dev"
start "Response Service" cmd /k "cd backend\response-service && npm run dev"
start "API Gateway" cmd /k "cd backend\api-gateway && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Services started in separate windows.
