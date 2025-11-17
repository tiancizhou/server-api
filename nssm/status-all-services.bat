@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title All Services Status
color 0A

:menu
cls
echo ==========================================
echo    MIO Card - All Services Status
echo ==========================================
echo.

:: Check Node.js service
sc query MIOCardService >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('sc query MIOCardService ^| findstr /C:"STATE"') do set NODE_STATE=%%i
    echo [1] Node.js Service (MIOCardService)
    echo     Status:       !NODE_STATE!
    echo     Port:         5200
    echo     URL:          http://localhost:5200
    
    :: Test connection
    if "!NODE_STATE!"=="RUNNING" (
        curl -s http://localhost:5200 >nul 2>nul
        if !errorlevel! equ 0 (
            echo     Connection:   [OK] Responding
        ) else (
            echo     Connection:   [X] Not responding
        )
    )
) else (
    echo [1] Node.js Service (MIOCardService)
    echo     Status:       NOT INSTALLED
)

echo.

:: Check Natapp service
sc query NatappTunnel >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('sc query NatappTunnel ^| findstr /C:"STATE"') do set NATAPP_STATE=%%i
    echo [2] Natapp Service (NatappTunnel)
    echo     Status:       !NATAPP_STATE!
    echo     Depends on:   MIOCardService
    
    :: Check config
    set PROJECT_DIR=%~dp0..
    if exist "!PROJECT_DIR!\natapp\config.ini" (
        echo     Config:       [OK] Found
    ) else (
        echo     Config:       [X] Missing
    )
    
    :: Show last log line if available
    if exist "!PROJECT_DIR!\logs\natapp-stdout.log" (
        if "!NATAPP_STATE!"=="RUNNING" (
            echo.
            echo     Recent log:
            for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-Content '!PROJECT_DIR!\logs\natapp-stdout.log' -Tail 1 -ErrorAction SilentlyContinue"') do (
                echo     %%a
            )
        )
    )
) else (
    echo [2] Natapp Service (NatappTunnel)
    echo     Status:       NOT INSTALLED
)

echo.

:: Show ports in use
echo ==========================================
echo    Network Status
echo ==========================================
echo.
netstat -ano | findstr :5200 >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 5200:        IN USE
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5200 ^| findstr LISTENING') do (
        set PID=%%a
        for /f "tokens=1" %%b in ('tasklist /FI "PID eq !PID!" /NH 2^>nul') do (
            echo Process:          %%b (PID: !PID!)
        )
    )
) else (
    echo Port 5200:        Available
)

echo.
echo ==========================================
echo    Quick Actions
echo ==========================================
echo.
echo   [1] Start all services
echo   [2] Stop all services
echo   [3] Restart all services
echo   [4] View Node.js logs
echo   [5] View Natapp logs
echo   [6] Open logs folder
echo   [7] Open Services Manager
echo   [8] Refresh status
echo   [0] Exit
echo.
set /p choice="Select option (0-8): "

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto :start_all
if "%choice%"=="2" goto :stop_all
if "%choice%"=="3" goto :restart_all
if "%choice%"=="4" goto :view_node_logs
if "%choice%"=="5" goto :view_natapp_logs
if "%choice%"=="6" goto :open_logs
if "%choice%"=="7" goto :open_services
if "%choice%"=="8" goto :menu

echo.
echo [!] Invalid choice
timeout /t 2 >nul
goto :menu

:start_all
echo.
echo Starting all services...
net start MIOCardService
timeout /t 3 >nul
net start NatappTunnel >nul 2>&1
timeout /t 2 >nul
goto :menu

:stop_all
echo.
echo Stopping all services...
net stop NatappTunnel >nul 2>&1
timeout /t 2 >nul
net stop MIOCardService
timeout /t 2 >nul
goto :menu

:restart_all
echo.
echo Restarting all services...
net stop NatappTunnel >nul 2>&1
net stop MIOCardService >nul 2>&1
timeout /t 3 >nul
net start MIOCardService
timeout /t 3 >nul
net start NatappTunnel >nul 2>&1
timeout /t 2 >nul
goto :menu

:view_node_logs
cls
echo ==========================================
echo    Node.js Service Logs (Real-time)
echo ==========================================
echo.
echo Press Ctrl+C to return to menu
echo.
set PROJECT_DIR=%~dp0..
if exist "%PROJECT_DIR%\logs\service-stdout.log" (
    powershell -NoProfile -Command "Get-Content '%PROJECT_DIR%\logs\service-stdout.log' -Wait -Tail 30"
) else (
    echo [!] Log file not found
    pause
)
goto :menu

:view_natapp_logs
cls
echo ==========================================
echo    Natapp Service Logs (Real-time)
echo ==========================================
echo.
echo Press Ctrl+C to return to menu
echo.
set PROJECT_DIR=%~dp0..
if exist "%PROJECT_DIR%\logs\natapp-stdout.log" (
    powershell -NoProfile -Command "Get-Content '%PROJECT_DIR%\logs\natapp-stdout.log' -Wait -Tail 30"
) else (
    echo [!] Log file not found
    pause
)
goto :menu

:open_logs
echo.
echo Opening logs folder...
set PROJECT_DIR=%~dp0..
start explorer "%PROJECT_DIR%\logs"
timeout /t 1 >nul
goto :menu

:open_services
echo.
echo Opening Services Manager...
start services.msc
timeout /t 1 >nul
goto :menu

