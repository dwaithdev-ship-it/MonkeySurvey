@echo off
echo Installing dependencies...

echo Installing Shared...
cd backend\shared 
call npm install
cd ..\..

echo Installing User Service...
cd backend\user-service 
call npm install
cd ..\..

echo Installing Survey Service...
cd backend\survey-service 
call npm install
cd ..\..

echo Installing Response Service...
cd backend\response-service 
call npm install
cd ..\..

echo Installing API Gateway...
cd backend\api-gateway 
call npm install
cd ..\..

echo Installing Frontend...
cd web\frontend 
call npm install
cd ..\..

echo All dependencies installed!
pause
