# KK Food Billing - Production Build Script
# This script builds the frontend for production

Write-Host "Building KK Food Billing Application for Production" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Production files are in the 'dist' folder" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run 'start-prod.ps1' to start the production server" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  2. Deploy the 'dist' folder to your web server" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Build failed! Please check the errors above." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
