@echo off
chcp 65001 >nul

title Stop Natapp Service
color 0E

echo ==========================================
echo    Stopping Natapp Service
echo ==========================================
echo.

set SERVICE_NAME=NatappTunnel

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Service not installed
    echo.
    echo The service "%SERVICE_NAME%" is not installed.
    echo.
    pause
    exit /b 1
)

:: Check if already stopped
for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i
if "%STATE%"=="STOPPED" (
    echo [!] Service is already stopped
    echo.
    pause
    exit /b 0
)

:: Stop service
echo Stopping service...
net stop "%SERVICE_NAME%"

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo    Service Stopped Successfully
    echo ==========================================
    echo.
    echo Service Name: %SERVICE_NAME%
    echo Status:       Stopped
    echo.
    echo The tunnel has been closed.
    echo.
    echo To start the service again, run: start-natapp-service.bat
    echo.
) else (
    echo.
    echo [X] ERROR: Failed to stop service
    echo.
    echo Try force stopping:
    echo   sc stop %SERVICE_NAME%
    echo.
)

pause

