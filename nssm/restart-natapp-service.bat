@echo off
chcp 65001 >nul

title Restart Natapp Service
color 0D

echo ==========================================
echo    Restarting Natapp Service
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

:: Get current state
for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i

echo Current status: %STATE%
echo.

:: Stop if running
if "%STATE%"=="RUNNING" (
    echo [1/2] Stopping service...
    net stop "%SERVICE_NAME%"
    if %errorlevel% neq 0 (
        echo [X] ERROR: Failed to stop service
        pause
        exit /b 1
    )
    echo [OK] Service stopped
    timeout /t 2 >nul
) else (
    echo [!] Service is not running, starting directly...
)

echo.
echo [2/2] Starting service...
net start "%SERVICE_NAME%"

if %errorlevel% equ 0 (
    echo [OK] Service started
    echo.
    echo ==========================================
    echo    Service Restarted Successfully
    echo ==========================================
    echo.
    echo Service Name: %SERVICE_NAME%
    echo Status:       Running
    echo.
    echo Check logs for tunnel URL:
    echo   logs\natapp-stdout.log
    echo.
) else (
    echo.
    echo [X] ERROR: Failed to start service
    echo.
    echo Please check:
    echo 1. Node.js service is running
    echo 2. natapp config.ini is valid
    echo 3. Error logs in logs\natapp-stderr.log
    echo.
)

pause

