@echo off
chcp 65001 >nul

title Stop All Services
color 0E

echo ==========================================
echo    Stopping All Services
echo ==========================================
echo.

:: Check if services exist
sc query MIOCardService >nul 2>&1
set NODE_EXISTS=%errorlevel%

sc query NatappTunnel >nul 2>&1
set NATAPP_EXISTS=%errorlevel%

if %NODE_EXISTS% neq 0 (
    echo [!] MIOCardService not installed
)

if %NATAPP_EXISTS% neq 0 (
    echo [!] NatappTunnel not installed
)

if %NODE_EXISTS% neq 0 (
    if %NATAPP_EXISTS% neq 0 (
        echo.
        echo [X] No services are installed
        pause
        exit /b 1
    )
)

:: Stop Natapp service first
if %NATAPP_EXISTS% equ 0 (
    echo [1/2] Stopping Natapp service...
    net stop NatappTunnel
    
    if %errorlevel% equ 0 (
        echo [OK] Natapp service stopped
    ) else (
        echo [!] Natapp service was not running or failed to stop
    )
    echo.
    timeout /t 2 >nul
) else (
    echo [1/2] Skipping Natapp (not installed)
    echo.
)

:: Stop Node.js service
if %NODE_EXISTS% equ 0 (
    echo [2/2] Stopping Node.js service...
    net stop MIOCardService
    
    if %errorlevel% equ 0 (
        echo [OK] Node.js service stopped
    ) else (
        echo [!] Node.js service was not running or failed to stop
    )
) else (
    echo [2/2] Skipping Node.js (not installed)
)

echo.
echo ==========================================
echo    Services Stopped
echo ==========================================
echo.
echo All services have been stopped.
echo.
echo To start again: start-all-services.bat
echo To check status: status-all-services.bat
echo.
pause

