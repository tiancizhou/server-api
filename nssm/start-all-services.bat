@echo off
chcp 65001 >nul

title Start All Services
color 0B

echo ==========================================
echo    Starting All Services
echo ==========================================
echo.

:: Check if services exist
sc query MIOCardService >nul 2>&1
set NODE_EXISTS=%errorlevel%

sc query NatappTunnel >nul 2>&1
set NATAPP_EXISTS=%errorlevel%

if %NODE_EXISTS% neq 0 (
    echo [X] ERROR: MIOCardService not installed
    echo.
    echo Please install services first:
    echo   install-all-services.bat
    echo.
    pause
    exit /b 1
)

if %NATAPP_EXISTS% neq 0 (
    echo [!] WARNING: NatappTunnel not installed
    echo Only Node.js service will be started
    echo.
)

:: Start Node.js service
echo [1/2] Starting Node.js service...
net start MIOCardService

if %errorlevel% neq 0 (
    echo [X] ERROR: Failed to start Node.js service
    echo.
    echo Troubleshooting:
    echo 1. Check if port 5200 is available
    echo 2. View logs: logs\service-stderr.log
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js service started
echo.

:: Wait for Node.js to be ready
echo Waiting for Node.js to initialize...
timeout /t 3 >nul

:: Start Natapp service
if %NATAPP_EXISTS% equ 0 (
    echo [2/2] Starting Natapp service...
    net start NatappTunnel
    
    if %errorlevel% neq 0 (
        echo [X] ERROR: Failed to start Natapp service
        echo.
        echo Node.js service is running, but natapp failed
        echo Check logs: logs\natapp-stderr.log
        echo.
        pause
        exit /b 1
    )
    
    echo [OK] Natapp service started
) else (
    echo [2/2] Skipping Natapp (not installed)
)

echo.
echo ==========================================
echo    All Services Started Successfully!
echo ==========================================
echo.
echo Running services:
echo   [OK] MIOCardService  - http://localhost:5200
if %NATAPP_EXISTS% equ 0 (
    echo   [OK] NatappTunnel    - Check logs for public URL
)
echo.
echo Logs location: logs\
echo   - service-stdout.log  - Node.js output
if %NATAPP_EXISTS% equ 0 (
    echo   - natapp-stdout.log   - Natapp output ^(tunnel URL^)
)
echo.
echo To check status: status-all-services.bat
echo To stop services: stop-all-services.bat
echo.
pause

