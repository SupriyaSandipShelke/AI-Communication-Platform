@echo off
echo Starting Unified Communication Hub...
echo.

REM Kill any existing processes on ports 3001 and 5173
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting the application...
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:3001
echo.

REM Start the development server
call npm run dev

pause