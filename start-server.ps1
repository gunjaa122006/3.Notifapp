# Event Reminder Server Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Event Reminder Tool - Server Startup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    pause
    exit 1
}

# Display Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if server.js exists
if (-not (Test-Path "server.js")) {
    Write-Host "ERROR: server.js not found!" -ForegroundColor Red
    pause
    exit 1
}

# Start the server
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""

node server.js

# Keep window open if server stops
Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
pause
