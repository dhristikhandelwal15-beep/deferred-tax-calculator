@echo off
setlocal
cd /d "%~dp0"
echo Starting Deferred Tax Calculator...
if not exist node_modules (
  echo Dependencies are not installed yet. Running npm install...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and Node.js installation.
    pause
    exit /b 1
  )
)
call npm run dev
pause
