@echo off
echo ===================================================
echo   Restarting MonkeySurvey Services to Apply Fixes
echo ===================================================
echo.

echo [1/4] Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Starting API Gateway...
start "API Gateway" cmd /k "cd backend\api-gateway && npm start"
timeout /t 2 /nobreak >nul

echo [3/4] Starting User Service (Fixed)...
start "User Service" cmd /k "cd backend\user-service && npm start"
timeout /t 2 /nobreak >nul

echo [4/4] Starting Other Services...
start "Survey Service" cmd /k "cd backend\survey-service && npm start"
start "Response Service" cmd /k "cd backend\response-service && npm start"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Services Restarted!
echo   Please try logging in with your phone number now.
echo ===================================================
echo.
pause
