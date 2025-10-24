@echo off
REM W3 VoIP Development Startup Script for Windows
REM This script starts all necessary services for development

echo 🚀 Starting W3 VoIP Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build shared package
echo 🔨 Building shared package...
cd packages\shared
call npm run build
cd ..\..

REM Build database package
echo 🗄️  Building database package...
cd packages\database
call npm run build
cd ..\..

REM Check if .env exists
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    copy env.example .env
    echo 📝 Please edit .env file with your configuration before continuing.
    echo    Required: DATABASE_URL, JWT_SECRET
    pause
    exit /b 1
)

REM Build backend
echo 🔨 Building backend...
cd packages\backend
call npm run build
cd ..\..

REM Build frontend
echo 🔨 Building frontend...
cd packages\frontend
call npm run build
cd ..\..

echo ✅ All packages built successfully!
echo.
echo 🎯 To start the development servers:
echo    Terminal 1: npm run dev:backend
echo    Terminal 2: npm run dev:frontend
echo.
echo 🌐 Access points:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000/api
echo    API Health: http://localhost:3000/api/health
echo.
echo 📚 Documentation:
echo    README.md - Project overview
echo    INSTALLATION.md - Detailed setup guide
echo.
echo 🔧 Troubleshooting:
echo    - Check logs: npm run logs
echo    - Restart services: npm run restart
echo    - Clean build: npm run clean ^&^& npm run build
echo.
echo Happy coding! 🎉
pause

