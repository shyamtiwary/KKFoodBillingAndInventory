# KK Food Billing - Stop All Servers
# This script stops all running backend and frontend servers

Write-Host "Stopping KK Food Billing Application..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Stop Backend
Write-Host "Stopping Backend Server..." -ForegroundColor Cyan
$backendProcess = Get-Process -Name "KKFoodBilling.Backend" -ErrorAction SilentlyContinue
if ($backendProcess) {
    Stop-Process -Name "KKFoodBilling.Backend" -Force
    Write-Host "  Backend stopped" -ForegroundColor Green
} else {
    Write-Host "  Backend not running" -ForegroundColor Gray
}

# Stop Node (Frontend dev server)
Write-Host "Stopping Frontend Dev Server..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*serve*" }
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  Frontend stopped" -ForegroundColor Green
} else {
    Write-Host "  Frontend not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "All servers stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
