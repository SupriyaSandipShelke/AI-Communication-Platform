@echo off
REM Proof script that runs exact same commands as GitHub Actions
REM This proves that all TypeScript errors are resolved

echo 🔍 Proving TypeScript compilation works...
echo Date: %date% %time%
echo Directory: %cd%
echo.

echo 1. Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ❌ Dependencies installation failed
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo 2. Running TypeScript compilation check...
call npx tsc --noEmit -p tsconfig.server.json
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation: FAILED
    exit /b 1
)
echo ✅ TypeScript compilation: SUCCESS
echo.

echo 3. Building server...
call npm run build:server
if %errorlevel% neq 0 (
    echo ❌ Server build: FAILED
    exit /b 1
)
echo ✅ Server build: SUCCESS
echo.

echo 4. Installing client dependencies...
cd client
call npm ci
if %errorlevel% neq 0 (
    echo ❌ Client dependencies installation failed
    exit /b 1
)
echo ✅ Client dependencies installed
echo.

echo 5. Building client...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Client build: FAILED
    exit /b 1
)
echo ✅ Client build: SUCCESS
echo.

echo 🎉 ALL CHECKS PASSED!
echo ✅ TypeScript Compilation: SUCCESS
echo ✅ Server Build: SUCCESS
echo ✅ Client Build: SUCCESS
echo.
echo This proves that all TypeScript errors are resolved!
echo GitHub Actions should pass with the same commands.