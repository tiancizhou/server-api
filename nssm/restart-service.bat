@echo off
chcp 65001 >nul

title Restart MIO Card Service
color 0D

echo ==========================================
echo    Restarting MIO Card Service
echo ==========================================
echo.

set SERVICE_NAME=MIOCardService

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Service not installed
    echo.
    echo Please install the service first using:
    echo   install-service.bat
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
    echo Local URL:    http://localhost:5200
    echo Logs:         logs\service-stdout.log
    echo.
) else (
    echo.
    echo [X] ERROR: Failed to start service
    echo.
    echo Please check:
    echo 1. Port 5200 availability
    echo 2. Error logs in logs\service-stderr.log
    echo 3. Windows Event Viewer
    echo.
)

pause

