@echo off
echo ================================================
echo   MongoDB Survey - Security Enhanced Version
echo ================================================
echo.

echo [1/3] Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath C:\data\db"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Backend Services...
start "API Gateway" cmd /k "cd backend\api-gateway && npm start"
timeout /t 2 /nobreak >nul
start "User Service" cmd /k "cd backend\user-service && npm start"
timeout /t 2 /nobreak >nul
start "Survey Service" cmd /k "cd backend\survey-service && npm start"
timeout /t 2 /nobreak >nul
start "Response Service" cmd /k "cd backend\response-service && npm start"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend...
timeout /t 5 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo   All services are starting...
echo ================================================
echo.
echo Backend API: http://localhost:4000
echo Frontend:    http://localhost:5173
echo.
echo IMPORTANT NOTES:
echo - Use phone number to login (10 digits)
echo - Location permission is required
echo - Only one session per user allowed
echo - Device binding enforced for security
echo.
echo See TESTING_GUIDE.md for detailed test scenarios
echo See SECURITY_ENHANCEMENTS.md for documentation
echo.
echo Press any key to exit this window...
pause >nul
