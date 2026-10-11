@echo off
title Lok Samadhan - Backend API Server (Port 5000)
cd /d "%~dp0"

echo =======================================================================
echo            Lok Samadhan - Civic Grievance Backend Server
echo =======================================================================
echo.

if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
)

echo [*] Launching Node.js Express Backend on http://localhost:5000 ...
echo [*] Connected to Supabase at: https://phkjucynruuqaxbgytrz.supabase.co
echo.
node src/server.js
pause
