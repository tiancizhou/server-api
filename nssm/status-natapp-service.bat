@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Natapp Service Status
color 0A

:menu
cls
echo ==========================================
echo    Natapp Service Status
echo ==========================================
echo.

set SERVICE_NAME=NatappTunnel

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Service Status: NOT INSTALLED
    echo.
    echo The service is not installed yet.
    echo.
    echo To install, run: install-natapp-service.bat
    echo.
    pause
    exit /b 1
)

:: Get detailed service info
echo Service Name:  %SERVICE_NAME%
echo Display Name:  Natapp Tunnel Service
echo.

for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i
for /f "tokens=1,2,3,4" %%i in ('sc qc "%SERVICE_NAME%" ^| findstr /C:"START_TYPE"') do set STARTUP=%%l

echo Status:        %STATE%
echo Startup Type:  %STARTUP%
echo.

:: Check dependency (Node.js service)
echo Checking dependencies...
sc query MIOCardService >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('sc query MIOCardService ^| findstr /C:"STATE"') do set NODE_STATE=%%i
    echo Node.js:       !NODE_STATE!
) else (
    echo Node.js:       NOT INSTALLED
)
echo.

:: Check natapp config
set PROJECT_DIR=%~dp0..
if exist "%PROJECT_DIR%\natapp\config.ini" (
    echo Config File:   [OK] Found
) else (
    echo Config File:   [X] Missing
)

:: Show recent log if available
if exist "%PROJECT_DIR%\logs\natapp-stdout.log" (
    echo.
    echo Recent log output (last 5 lines):
    echo ----------------------------------------
    powershell -NoProfile -Command "Get-Content '%PROJECT_DIR%\logs\natapp-stdout.log' -Tail 5 -ErrorAction SilentlyContinue"
    echo ----------------------------------------
)

echo.
echo ==========================================
echo    Quick Actions
echo ==========================================
echo.
echo   [1] Start service
echo   [2] Stop service
echo   [3] Restart service
echo   [4] View logs (real-time)
echo   [5] View all logs folder
echo   [6] Open Services Manager (services.msc)
echo   [7] Refresh status
echo   [0] Exit
echo.
set /p choice="Select option (0-7): "

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto :start_service
if "%choice%"=="2" goto :stop_service
if "%choice%"=="3" goto :restart_service
if "%choice%"=="4" goto :view_logs
if "%choice%"=="5" goto :open_logs
if "%choice%"=="6" goto :open_services
if "%choice%"=="7" goto :menu

echo.
echo [!] Invalid choice
timeout /t 2 >nul
goto :menu

:start_service
echo.
echo Starting service...
net start "%SERVICE_NAME%"
timeout /t 3 >nul
goto :menu

:stop_service
echo.
echo Stopping service...
net stop "%SERVICE_NAME%"
timeout /t 2 >nul
goto :menu

:restart_service
echo.
echo Restarting service...
net stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 >nul
net start "%SERVICE_NAME%"
timeout /t 3 >nul
goto :menu

:view_logs
cls
echo ==========================================
echo    Natapp Real-time Logs
echo ==========================================
echo.
echo Press Ctrl+C to stop watching
echo.
if exist "%PROJECT_DIR%\logs\natapp-stdout.log" (
    powershell -NoProfile -Command "Get-Content '%PROJECT_DIR%\logs\natapp-stdout.log' -Wait -Tail 30"
) else (
    echo [!] Log file not found
    echo.
    echo The service may not have started yet.
    pause
)
goto :menu

:open_logs
echo.
echo Opening logs folder...
start explorer "%PROJECT_DIR%\logs"
timeout /t 1 >nul
goto :menu

:open_services
echo.
echo Opening Services Manager...
start services.msc
timeout /t 1 >nul
goto :menu

