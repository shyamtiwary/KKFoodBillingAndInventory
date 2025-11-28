# KK Food Billing - Development Mode Startup
# This script starts both backend and frontend in development mode

Write-Host "Starting KK Food Billing Application (Development Mode)" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\KKFoodBilling.Backend'; Write-Host 'Backend Server - Press Ctrl+C to stop' -ForegroundColor Yellow; dotnet run"

# Wait a bit for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Server - Press Ctrl+C to stop' -ForegroundColor Yellow; npm run dev"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:55219" -ForegroundColor White
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Data files location: backend\KKFoodBilling.Backend\Data\" -ForegroundColor White
Write-Host "  - products.json" -ForegroundColor Gray
Write-Host "  - bills.json" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window (servers will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
