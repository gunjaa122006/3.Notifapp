# Running the Development Server

## Quick Start (Choose One Method)

### Method 1: Double-Click (Easiest)
- **Windows**: Double-click `start-server.bat`
- **PowerShell**: Right-click `start-server.ps1` → Run with PowerShell

### Method 2: Command Line
```bash
# Using npm
npm start

# Or directly with Node
node server.js
```

### Method 3: VS Code Live Server (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → Open with Live Server
3. Auto-refreshes on file changes!

## Server URLs

Once started, access the app at:
- http://localhost:8000
- http://127.0.0.1:8000

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /F /PID <PID>

# Or use a different port
set PORT=8001
node server.js
```

### Permission Denied
- Run as Administrator
- Use port above 1024 (e.g., 8000, 8080, 3000)

### Server Starts But Can't Connect
1. Check Windows Firewall settings
2. Try http://127.0.0.1:8000 instead of localhost
3. Disable antivirus temporarily to test

### PowerShell Script Won't Run
```powershell
# Set execution policy (run as Admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Features

- ✅ Serves static files (HTML, CSS, JS)
- ✅ Proper MIME types for all file types
- ✅ Request logging
- ✅ Error handling
- ✅ No-cache headers for development
- ✅ Security: Directory traversal protection
- ✅ Graceful shutdown with Ctrl+C

## Environment Variables

```bash
# Custom port
set PORT=3000
node server.js

# Or in PowerShell
$env:PORT=3000
node server.js
```

## For All Your Projects

Copy these files to any project:
- `server.js` - The server code
- `package.json` - Project configuration
- `start-server.bat` - Windows quick start
- `start-server.ps1` - PowerShell script

Then just run `npm start` or double-click the batch file!

## Stopping the Server

- Press `Ctrl+C` in the terminal
- Close the command window
- In VS Code: Click "Stop" in terminal
