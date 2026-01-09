@echo off
echo ========================================
echo Starting Event Reminder Server
echo ========================================
echo.

cd /d "%~dp0"
node server.js

pause
