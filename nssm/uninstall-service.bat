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

title Uninstall MIO Card Service
color 0C

echo ==========================================
echo    MIO Card Service Uninstaller
echo ==========================================
echo.

set NSSM_PATH=%~dp0nssm.exe
set SERVICE_NAME=MIOCardService

:: Check NSSM
echo [1/3] Checking NSSM...
if not exist "%NSSM_PATH%" (
    echo [X] ERROR: nssm.exe not found
    echo.
    echo NSSM is required for uninstallation.
    echo You can manually remove the service using:
    echo   sc delete %SERVICE_NAME%
    echo.
    pause
    exit /b 1
)
echo [OK] NSSM found

:: Check if service exists
echo [2/3] Checking service...
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Service not found
    echo.
    echo Service "%SERVICE_NAME%" is not installed.
    echo.
    pause
    exit /b 0
)
echo [OK] Service found

:: Confirm uninstallation
echo.
echo ==========================================
echo    WARNING
echo ==========================================
echo.
echo This will permanently remove the service:
echo   %SERVICE_NAME%
echo.
set /p CONFIRM="Are you sure? (Y/N): "
if /i "!CONFIRM!" neq "Y" (
    echo.
    echo Uninstallation cancelled
    pause
    exit /b 0
)

:: Stop service
echo.
echo [3/3] Removing service...
echo Stopping service...
net stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 >nul

:: Remove service
echo Uninstalling service...
"%NSSM_PATH%" remove "%SERVICE_NAME%" confirm

if %errorlevel% equ 0 (
    echo [OK] Service removed successfully
) else (
    echo [X] ERROR: Failed to remove service
    echo.
    echo You can try manually:
    echo   sc delete %SERVICE_NAME%
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    Uninstallation Complete
echo ==========================================
echo.
echo Service "%SERVICE_NAME%" has been removed.
echo.
echo Note: Log files in the logs/ folder are preserved.
echo You can manually delete them if needed.
echo.
pause

