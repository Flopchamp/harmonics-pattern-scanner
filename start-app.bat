@echo off
echo Starting Harmonic Pattern Scanner...
echo.

REM Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd %~dp0 && npm start"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend...
start "Frontend" cmd /k "cd %~dp0client && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
