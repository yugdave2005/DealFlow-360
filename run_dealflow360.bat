@echo off
color 0B
echo ========================================================
echo           Starting DealFlow360 Environment...
echo ========================================================
echo.

echo [1/2] Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker is not installed or not running.
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b
)

echo [2/2] Launching Docker Containers...
docker compose up -d

echo.
echo ========================================================
echo SUCCESS! The environment is spinning up in the background.
echo.
echo - Frontend is available at: http://localhost:5173
echo - Backend API is available at: http://localhost:5001/api/v1
echo.
echo Note: If this is the first time running, it may take a minute 
echo for databases (Postgres, Redis) to initialize.
echo.
echo To stop the environment later, you can run:
echo docker compose down
echo ========================================================
echo.
pause
