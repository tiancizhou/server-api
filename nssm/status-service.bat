@echo off
chcp 65001 >nul

title MIO Card Service Status
color 0A

:menu
cls
echo ==========================================
echo    MIO Card Service Status
echo ==========================================
echo.

set SERVICE_NAME=MIOCardService

:: Check if service exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Service Status: NOT INSTALLED
    echo.
    echo The service is not installed yet.
    echo.
    echo To install, run: install-service.bat
    echo.
    pause
    exit /b 1
)

:: Get detailed service info
echo Service Name:  %SERVICE_NAME%
echo Display Name:  MIO Card API Service
echo.

for /f "tokens=3" %%i in ('sc query "%SERVICE_NAME%" ^| findstr /C:"STATE"') do set STATE=%%i
for /f "tokens=1,2,3,4" %%i in ('sc qc "%SERVICE_NAME%" ^| findstr /C:"START_TYPE"') do set STARTUP=%%l

echo Status:        %STATE%
echo Startup Type:  %STARTUP%
echo.

:: Check if port is in use
echo Checking port 5200...
netstat -ano | findstr :5200 >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 5200:     IN USE
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5200 ^| findstr LISTENING') do set PID=%%a
    if defined PID (
        for /f "tokens=1" %%b in ('tasklist /FI "PID eq !PID!" /NH') do set PROCESS=%%b
        echo Process:       !PROCESS! (PID: !PID!)
    )
) else (
    echo Port 5200:     Available
)

echo.

:: Test connection if running
if "%STATE%"=="RUNNING" (
    echo Testing connection...
    curl -s http://localhost:5200 >nul 2>nul
    if %errorlevel% equ 0 (
        echo Service Test:  [OK] Responding
        echo Local URL:     http://localhost:5200
    ) else (
        echo Service Test:  [!] Not responding
    )
) else (
    echo Service Test:  [!] Service not running
)

echo.
echo ==========================================
echo    Quick Actions
echo ==========================================
echo.
echo   [1] Start service
echo   [2] Stop service
echo   [3] Restart service
echo   [4] View logs
echo   [5] Open Services Manager (services.msc)
echo   [6] Refresh status
echo   [0] Exit
echo.
set /p choice="Select option (0-6): "

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto :start_service
if "%choice%"=="2" goto :stop_service
if "%choice%"=="3" goto :restart_service
if "%choice%"=="4" goto :view_logs
if "%choice%"=="5" goto :open_services
if "%choice%"=="6" goto :menu

echo.
echo [!] Invalid choice
timeout /t 2 >nul
goto :menu

:start_service
echo.
echo Starting service...
net start "%SERVICE_NAME%"
timeout /t 2 >nul
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
timeout /t 1 >nul
net start "%SERVICE_NAME%"
timeout /t 2 >nul
goto :menu

:view_logs
echo.
echo Opening logs folder...
start explorer "%~dp0..\logs"
timeout /t 1 >nul
goto :menu

:open_services
echo.
echo Opening Services Manager...
start services.msc
timeout /t 1 >nul
goto :menu

