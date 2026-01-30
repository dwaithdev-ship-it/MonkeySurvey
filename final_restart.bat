@echo off
echoOptions
echo   FINAL SERVICE RESTART
echo ===================================================
echo.

echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/5] Starting API Gateway...
cd backend\api-gateway
start "API Gateway" npm start
cd ..\..

echo [3/5] Starting User Service...
cd backend\user-service
start "User Service" npm start
cd ..\..

echo [4/5] Starting Survey & Response Services...
cd backend\survey-service
start "Survey Service" npm start
cd ..\..
cd backend\response-service
start "Response Service" npm start
cd ..\..

echo [5/5] Starting Frontend...
cd frontend
start "Frontend" npm run dev
cd ..

echo.
echo ===================================================
echo   Services are restarting. Please wait 15 seconds.
echo   Then try logging in with:
echo     Phone: 9392618252
echo     Pass:  Test@123
echo ===================================================
echo.
pause
