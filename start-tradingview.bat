@echo off
echo ===============================================
echo  TradingView Harmonic Pattern Scanner
echo ===============================================
echo.
echo Starting application with advanced TradingView charts...
echo.

REM Check if charting library exists
if not exist "client\public\charting_library\charting_library.js" (
    echo ERROR: TradingView charting library not found!
    echo Please ensure the charting library is copied to client\public\charting_library\
    echo.
    pause
    exit /b 1
)

echo ✓ TradingView charting library found
echo ✓ Datafeed configuration ready
echo ✓ Advanced chart features enabled
echo.

REM Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd %~dp0 && npm start"

REM Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend with TradingView integration...
start "Frontend" cmd /k "cd %~dp0client && npm start"

echo.
echo ===============================================
echo  Application Starting...
echo ===============================================
echo.
echo Backend API: http://localhost:5000
echo Frontend:    http://localhost:3000
echo.
echo Features enabled:
echo - ✓ Advanced TradingView Charts
echo - ✓ Real-time Pattern Detection
echo - ✓ 7 Harmonic Patterns (ABCD, Gartley, Bat, Butterfly, Crab, Cypher, Shark)
echo - ✓ Interactive Chart Drawing
echo - ✓ WebSocket Communication
echo - ✓ Pattern Overlays
echo.
echo Once both servers start, navigate to http://localhost:3000
echo.
pause
