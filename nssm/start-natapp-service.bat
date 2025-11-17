@echo off
chcp 65001 >nul

title Start Natapp Service
color 0B

echo ==========================================
echo    Starting Natapp Service
echo ==========================================
echo.

set SERVICE_NAME=NatappTunnel

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Service not installed
    echo.
    echo Please install the service first using:
    echo   install-natapp-service.bat
    echo.
    pause
    exit /b 1
)

:: Check if already running
for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i
if "%STATE%"=="RUNNING" (
    echo [!] Service is already running
    echo.
    echo Service Status: Running
    echo.
    echo Check natapp logs for tunnel URL:
    echo   logs\natapp-stdout.log
    echo.
    pause
    exit /b 0
)

:: Check if Node.js service is running
sc query MIOCardService >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('sc query MIOCardService ^| findstr /C:"STATE"') do set NODE_STATE=%%i
    if not "!NODE_STATE!"=="RUNNING" (
        echo [!] WARNING: Node.js service is not running
        echo.
        echo Natapp depends on Node.js service (port 5200).
        echo Please start Node.js service first:
        echo   start-service.bat
        echo.
        set /p START_NODE="Start Node.js service now? (Y/N): "
        if /i "!START_NODE!"=="Y" (
            echo.
            echo Starting Node.js service...
            net start MIOCardService
            timeout /t 3 >nul
        )
    )
)

:: Start service
echo Starting natapp service...
net start "%SERVICE_NAME%"

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo    Service Started Successfully
    echo ==========================================
    echo.
    echo Service Name: %SERVICE_NAME%
    echo Status:       Running
    echo.
    echo The tunnel URL will be shown in the logs:
    echo   logs\natapp-stdout.log
    echo.
    echo To view logs in real-time:
    echo   powershell -Command "Get-Content logs\natapp-stdout.log -Wait -Tail 20"
    echo.
) else (
    echo.
    echo [X] ERROR: Failed to start service
    echo.
    echo Troubleshooting:
    echo 1. Make sure Node.js service is running on port 5200
    echo 2. Check natapp config.ini exists and is valid
    echo 3. View error logs: logs\natapp-stderr.log
    echo.
)

pause

