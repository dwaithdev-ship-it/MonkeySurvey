@echo off
echo Deploying to AWS Server...
echo.

REM Connect to AWS and run deployment commands
ssh -i monkeysurvey.pem ubuntu@13.49.231.22 "cd BodhaSurvey && git pull origin main && sudo docker compose down && sudo docker compose up -d --build"

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo SSH Connection Failed!
    echo ========================================
    echo.
    echo Please use one of these alternatives:
    echo.
    echo 1. AWS Console - EC2 Instance Connect:
    echo    - Go to AWS Console ^> EC2 ^> Instances
    echo    - Select your instance
    echo    - Click "Connect" ^> "EC2 Instance Connect"
    echo    - Run these commands:
    echo      cd BodhaSurvey
    echo      git pull origin main
    echo      sudo docker compose down
    echo      sudo docker compose up -d --build
    echo.
    echo 2. AWS Systems Manager Session Manager:
    echo    - Go to AWS Console ^> Systems Manager ^> Session Manager
    echo    - Start a session with your instance
    echo    - Run the same commands as above
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Successful!
echo ========================================
echo.
echo Your application should be live at:
echo https://bodhasurvey.duckdns.org/
echo.
echo Make sure to update DuckDNS to point to: 13.49.231.22
echo.
pause
