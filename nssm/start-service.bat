@echo off
chcp 65001 >nul

title Start MIO Card Service
color 0B

echo ==========================================
echo    Starting MIO Card Service
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

:: Check if already running
for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i
if "%STATE%"=="RUNNING" (
    echo [!] Service is already running
    echo.
    echo Service Status: Running
    echo Local URL:     http://localhost:5200
    echo.
    pause
    exit /b 0
)

:: Start service
echo Starting service...
net start "%SERVICE_NAME%"

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo    Service Started Successfully
    echo ==========================================
    echo.
    echo Service Name: %SERVICE_NAME%
    echo Local URL:    http://localhost:5200
    echo Logs:         logs\service-stdout.log
    echo.
    echo To stop the service, run: stop-service.bat
    echo.
) else (
    echo.
    echo [X] ERROR: Failed to start service
    echo.
    echo Troubleshooting:
    echo 1. Check if port 5200 is already in use:
    echo    netstat -ano ^| findstr :5200
    echo.
    echo 2. View error logs:
    echo    logs\service-stderr.log
    echo.
    echo 3. Check Windows Event Viewer for details
    echo.
)

pause

