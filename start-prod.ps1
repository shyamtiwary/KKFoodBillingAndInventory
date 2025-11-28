# KK Food Billing - Production Mode Startup
# This script starts the application in production mode
# PREREQUISITES: Run 'build-prod.ps1' first to create the production build

Write-Host "Starting KK Food Billing Application (Production Mode)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "ERROR: Production build not found!" -ForegroundColor Red
    Write-Host "Please run 'build-prod.ps1' first to create the production build." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to close..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if serve is installed
$serveInstalled = Get-Command serve -ErrorAction SilentlyContinue
if (-not $serveInstalled) {
    Write-Host "Installing 'serve' package..." -ForegroundColor Yellow
    npm install -g serve
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install 'serve' package." -ForegroundColor Red
        Write-Host "Please install it manually: npm install -g serve" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Press any key to close..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

# Start Backend in Release mode
Write-Host "Starting Backend Server (Release mode)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\KKFoodBilling.Backend'; Write-Host 'Backend Server (Production) - Press Ctrl+C to stop' -ForegroundColor Yellow; dotnet run --configuration Release"

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend with serve
Write-Host "Starting Frontend Server (Production build)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Server (Production) - Press Ctrl+C to stop' -ForegroundColor Yellow; serve -s dist -l 8080"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Application started in PRODUCTION mode!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:55219" -ForegroundColor White
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Data files location: backend\KKFoodBilling.Backend\Data\" -ForegroundColor White
Write-Host "  - products.json" -ForegroundColor Gray
Write-Host "  - bills.json" -ForegroundColor Gray
Write-Host ""
Write-Host "NOTE: This is using the optimized production build" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window (servers will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
