@echo off
REM APD Project Setup Script for Windows

echo ================================================
echo ACGN Personality Database - Setup Script
echo ================================================
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo ✓ All dependencies installed!
echo.

REM Check for .env files
echo Checking environment files...

if not exist "frontend\.env" (
    echo WARNING: frontend\.env not found
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env"
        echo Created frontend\.env from example
        echo Please edit frontend\.env with your Supabase credentials
    )
)

if not exist "backend\.env" (
    echo WARNING: backend\.env not found
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env"
        echo Created backend\.env from example
        echo Please edit backend\.env with your API keys
    )
)

echo.
echo ================================================
echo Setup complete!
echo ================================================
echo.
echo Next steps:
echo 1. Configure frontend\.env with Supabase credentials
echo 2. Configure backend\.env with API keys
echo 3. Run 'npm run dev' to start both frontend and backend
echo.
echo Documentation:
echo    - README.md - Project overview
echo    - DEPLOYMENT.md - Deployment guide
echo.
echo Default URLs:
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:3001
echo.
pause

