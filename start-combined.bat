@echo off
chcp 65001 >nul
title MIO Card Service - Combined Startup
color 0B

echo ==========================================
echo    MIO Card Service - Combined Startup
echo ==========================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ERROR: Node.js not found
    echo Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

:: Check dependencies
if not exist "node_modules" (
    echo [2/5] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
) else (
    echo [2/5] [OK] Dependencies installed
    echo.
)

:: Create logs directory
echo [3/5] Preparing logs...
if not exist "logs" mkdir logs

:: Generate log filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list 2^>nul') do set datetime=%%I
if not defined datetime (
    set LOG_DATE=latest
) else (
    set LOG_DATE=%datetime:~0,8%-%datetime:~8,6%
)
set NODE_LOG=%~dp0logs\node-%LOG_DATE%.log

echo Log file: logs\node-%LOG_DATE%.log
echo.

:: Write log header
echo ========================================== > "%NODE_LOG%"
echo MIO Card Service - Node.js Log >> "%NODE_LOG%"
echo Start time: %date% %time% >> "%NODE_LOG%"
echo ========================================== >> "%NODE_LOG%"
echo. >> "%NODE_LOG%"

:: Check natapp (prioritize project directory)
echo [4/5] Checking natapp.exe...
set NATAPP_PATH=
if exist "%~dp0natapp\natapp.exe" set NATAPP_PATH=%~dp0natapp\natapp.exe
if exist "%~dp0natapp.exe" set NATAPP_PATH=%~dp0natapp.exe
if exist "C:\tools\natapp\natapp.exe" set NATAPP_PATH=C:\tools\natapp\natapp.exe
if exist "C:\Tools\natapp.exe" set NATAPP_PATH=C:\Tools\natapp.exe

if "%NATAPP_PATH%"=="" (
    echo [!] natapp.exe not found, starting local server only
    echo.
    goto :server_only
)
echo [OK] natapp.exe found
echo.

:: Start services
echo [5/5] Starting services...
echo.
echo ==========================================
echo    Local: http://localhost:5200
echo    Tunnel: Will show below
echo    Log: logs\node-%LOG_DATE%.log
echo ==========================================
echo.
echo [!] Press Ctrl+C to stop all services
echo.

:: Start Node.js server in background (with logging)
echo +------------------------------------------+
echo ^|  [Node.js] Starting server...           ^|
echo +------------------------------------------+
start /B cmd /c "node server.js >> "%NODE_LOG%" 2>&1"

:: Wait for server to start
echo Waiting for server to start...
timeout /t 3 >nul

:: Test server
curl -s http://localhost:5200 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js server started successfully
) else (
    echo [!] WARNING: Cannot confirm server status
)
echo.

:: Start natapp in foreground
echo +------------------------------------------+
echo ^|  [natapp] Starting tunnel...            ^|
echo +------------------------------------------+
echo.
echo ==========================================
echo    natapp output (URL will show below)
echo ==========================================
echo.

:: Run natapp (foreground)
"%NATAPP_PATH%"

:: After natapp exits, stop Node.js server
echo.
echo.
echo ==========================================
echo    natapp stopped, closing server...
echo ==========================================
taskkill /F /IM node.exe >nul 2>nul
echo [OK] All services stopped
echo.
pause
exit /b 0

:server_only
:: Server only mode
echo [5/5] Starting local server...
echo.
echo ==========================================
echo    Local: http://localhost:5200
echo    Log: logs\node-%LOG_DATE%.log
echo    WARNING: Local access only
echo ==========================================
echo.
echo [!] Press Ctrl+C to stop server
echo    Logs will be saved to file
echo.
echo +------------------------------------------+
echo ^|  [Node.js] Server running...            ^|
echo +------------------------------------------+
echo.

:: Run directly with logging
node server.js >> "%NODE_LOG%" 2>&1

echo.
echo [OK] Server stopped
echo Log saved: %NODE_LOG%
echo.
pause
