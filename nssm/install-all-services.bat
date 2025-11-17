@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Check administrator rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ==========================================
    echo    ERROR: Administrator rights required
    echo ==========================================
    echo.
    echo Please right-click this script and select
    echo "Run as administrator"
    echo.
    pause
    exit /b 1
)

title Install All Services
color 0B

echo ==========================================
echo    MIO Card - Install All Services
echo ==========================================
echo.
echo This will install:
echo   1. MIOCardService  - Node.js API service
echo   2. NatappTunnel    - Natapp tunnel service
echo.
echo Both services will:
echo   - Start automatically on system boot
echo   - Run in background (no console window)
echo   - Auto-restart on failure
echo.
set /p CONFIRM="Continue installation? (Y/N): "
if /i "!CONFIRM!" neq "Y" (
    echo Installation cancelled
    pause
    exit /b 0
)

echo.
echo ==========================================
echo    Step 1: Install Node.js Service
echo ==========================================
echo.

call "%~dp0install-service.bat"

if %errorlevel% neq 0 (
    echo.
    echo [X] ERROR: Node.js service installation failed
    echo Cannot continue with natapp installation
    pause
    exit /b 1
)

echo.
echo.
echo ==========================================
echo    Step 2: Install Natapp Service
echo ==========================================
echo.

call "%~dp0install-natapp-service.bat"

if %errorlevel% neq 0 (
    echo.
    echo [X] ERROR: Natapp service installation failed
    echo.
    echo Note: Node.js service was installed successfully
    echo You can use it independently if needed
    pause
    exit /b 1
)

echo.
echo.
echo ==========================================
echo    All Services Installed Successfully!
echo ==========================================
echo.
echo Installed services:
echo   [1] MIOCardService  - Node.js API (port 5200)
echo   [2] NatappTunnel    - Tunnel service (depends on #1)
echo.
echo ==========================================
echo    Next Steps
echo ==========================================
echo.
echo 1. Start all services:
echo    - Run: start-all-services.bat
echo    - Or:  net start MIOCardService
echo           (NatappTunnel will start automatically)
echo.
echo 2. Check status:
echo    - Run: status-all-services.bat
echo.
echo 3. View logs:
echo    - Node.js: logs\service-stdout.log
echo    - Natapp:  logs\natapp-stdout.log
echo.
echo 4. Manage services:
echo    - Services Manager: services.msc
echo    - Or use individual scripts in nssm\ folder
echo.
echo Services will start automatically on next reboot!
echo.
pause

