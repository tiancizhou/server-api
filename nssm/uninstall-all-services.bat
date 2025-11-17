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

title Uninstall All Services
color 0C

echo ==========================================
echo    Uninstall All Services
echo ==========================================
echo.

set NSSM_PATH=%~dp0nssm.exe

:: Check if services exist
sc query MIOCardService >nul 2>&1
set NODE_EXISTS=%errorlevel%

sc query NatappTunnel >nul 2>&1
set NATAPP_EXISTS=%errorlevel%

if %NODE_EXISTS% neq 0 (
    if %NATAPP_EXISTS% neq 0 (
        echo [!] No services are installed
        echo.
        pause
        exit /b 0
    )
)

echo This will permanently remove the following services:
echo.
if %NODE_EXISTS% equ 0 echo   - MIOCardService  (Node.js API)
if %NATAPP_EXISTS% equ 0 echo   - NatappTunnel    (Tunnel service)
echo.
set /p CONFIRM="Are you sure? (Y/N): "
if /i "!CONFIRM!" neq "Y" (
    echo.
    echo Uninstallation cancelled
    pause
    exit /b 0
)

echo.

:: Uninstall Natapp service first
if %NATAPP_EXISTS% equ 0 (
    echo [1/2] Removing Natapp service...
    net stop NatappTunnel >nul 2>&1
    timeout /t 2 >nul
    "%NSSM_PATH%" remove NatappTunnel confirm
    
    if %errorlevel% equ 0 (
        echo [OK] Natapp service removed
    ) else (
        echo [X] Failed to remove Natapp service
    )
    echo.
) else (
    echo [1/2] Skipping Natapp (not installed)
    echo.
)

:: Uninstall Node.js service
if %NODE_EXISTS% equ 0 (
    echo [2/2] Removing Node.js service...
    net stop MIOCardService >nul 2>&1
    timeout /t 2 >nul
    "%NSSM_PATH%" remove MIOCardService confirm
    
    if %errorlevel% equ 0 (
        echo [OK] Node.js service removed
    ) else (
        echo [X] Failed to remove Node.js service
    )
) else (
    echo [2/2] Skipping Node.js (not installed)
)

echo.
echo ==========================================
echo    Uninstallation Complete
echo ==========================================
echo.
echo All services have been removed from the system.
echo.
echo Note: Log files in logs\ folder are preserved.
echo You can manually delete them if needed.
echo.
pause

