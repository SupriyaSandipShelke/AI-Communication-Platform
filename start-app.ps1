Write-Host "🚀 Starting Unified Communication Hub..." -ForegroundColor Green
Write-Host ""

# Kill any existing Node.js processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host ""
Write-Host "🌐 Starting the application..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev