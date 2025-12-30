# KK Food Billing - Automated Test Runner
# This script helps you run automated tests easily

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  KK Food Billing - Automated Test Runner" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  1. Open a new terminal" -ForegroundColor White
    Write-Host "  2. Navigate to: backend\KKFoodBilling.Backend" -ForegroundColor White
    Write-Host "  3. Run: dotnet run" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Select test mode:" -ForegroundColor Cyan
Write-Host "  1. Run all tests (headless)" -ForegroundColor White
Write-Host "  2. Run with UI (interactive)" -ForegroundColor White
Write-Host "  3. Run with visible browser" -ForegroundColor White
Write-Host "  4. Run only User Management tests" -ForegroundColor White
Write-Host "  5. Run only Inventory tests" -ForegroundColor White
Write-Host "  6. Run only Authentication tests" -ForegroundColor White
Write-Host "  7. View test report" -ForegroundColor White
Write-Host "  8. Debug mode" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-8)"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan

switch ($choice) {
    "1" {
        Write-Host "Running all tests..." -ForegroundColor Green
        npm test
    }
    "2" {
        Write-Host "Opening interactive UI..." -ForegroundColor Green
        npm run test:ui
    }
    "3" {
        Write-Host "Running tests with visible browser..." -ForegroundColor Green
        npm run test:headed
    }
    "4" {
        Write-Host "Running User Management tests..." -ForegroundColor Green
        npx playwright test user-management
    }
    "5" {
        Write-Host "Running Inventory tests..." -ForegroundColor Green
        npx playwright test inventory
    }
    "6" {
        Write-Host "Running Authentication tests..." -ForegroundColor Green
        npx playwright test auth
    }
    "7" {
        Write-Host "Opening test report..." -ForegroundColor Green
        npm run test:report
    }
    "8" {
        Write-Host "Starting debug mode..." -ForegroundColor Green
        npm run test:debug
    }
    default {
        Write-Host "Invalid choice. Running all tests..." -ForegroundColor Yellow
        npm test
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host ""
Write-Host "To view the test report, run:" -ForegroundColor Yellow
Write-Host "  npm run test:report" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
