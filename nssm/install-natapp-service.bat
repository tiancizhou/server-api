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

title Install Natapp Service
color 0B

echo ==========================================
echo    Natapp Service Installer
echo ==========================================
echo.

:: Set paths
set PROJECT_DIR=%~dp0..
set NSSM_PATH=%~dp0nssm.exe
set SERVICE_NAME=NatappTunnel
set DISPLAY_NAME=Natapp Tunnel Service

:: Check NSSM
echo [1/4] Checking NSSM...
if not exist "%NSSM_PATH%" (
    echo [X] ERROR: nssm.exe not found
    echo.
    echo Expected location: %~dp0nssm.exe
    echo.
    echo Please make sure nssm.exe exists in the nssm directory.
    echo If missing, download from: https://nssm.cc/download
    echo.
    pause
    exit /b 1
)
echo [OK] NSSM found

:: Check natapp
echo [2/4] Checking natapp.exe...
set NATAPP_PATH=
if exist "%PROJECT_DIR%\natapp\natapp.exe" set NATAPP_PATH=%PROJECT_DIR%\natapp\natapp.exe
if exist "%PROJECT_DIR%\natapp.exe" set NATAPP_PATH=%PROJECT_DIR%\natapp.exe

if "%NATAPP_PATH%"=="" (
    echo [X] ERROR: natapp.exe not found
    echo.
    echo Searched locations:
    echo   - %PROJECT_DIR%\natapp\natapp.exe
    echo   - %PROJECT_DIR%\natapp.exe
    echo.
    echo Please make sure natapp.exe is in the project directory.
    echo.
    pause
    exit /b 1
)
echo [OK] natapp.exe found: !NATAPP_PATH!

:: Check natapp config
if not exist "%PROJECT_DIR%\natapp\config.ini" (
    echo [!] WARNING: natapp config.ini not found
    echo.
    echo Expected location: %PROJECT_DIR%\natapp\config.ini
    echo.
    echo The service will be installed, but may not work without config.
    echo Please create config.ini before starting the service.
    echo.
    set /p CONTINUE="Continue installation? (Y/N): "
    if /i "!CONTINUE!" neq "Y" (
        echo Installation cancelled
        pause
        exit /b 0
    )
)

:: Check if service exists
echo [3/4] Checking existing service...
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [!] WARNING: Service already exists
    echo.
    set /p CONFIRM="Do you want to reinstall? (Y/N): "
    if /i "!CONFIRM!" neq "Y" (
        echo.
        echo Installation cancelled
        pause
        exit /b 0
    )
    echo.
    echo Removing existing service...
    net stop "%SERVICE_NAME%" >nul 2>&1
    "%NSSM_PATH%" remove "%SERVICE_NAME%" confirm >nul 2>&1
    timeout /t 2 >nul
    echo [OK] Old service removed
) else (
    echo [OK] No existing service found
)

:: Install service
echo [4/4] Installing service...

:: Install NSSM service
"%NSSM_PATH%" install "%SERVICE_NAME%" "!NATAPP_PATH!"

if %errorlevel% neq 0 (
    echo [X] ERROR: Service installation failed
    pause
    exit /b 1
)

:: Configure service
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%DISPLAY_NAME%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "Natapp internal network penetration tunnel service"
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

:: Set working directory (for config.ini)
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%PROJECT_DIR%\natapp"

:: Set log files
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%PROJECT_DIR%\logs\natapp-stdout.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%PROJECT_DIR%\logs\natapp-stderr.log"

:: Set log rotation
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdoutCreationDisposition 4
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderrCreationDisposition 4

:: Set restart behavior
"%NSSM_PATH%" set "%SERVICE_NAME%" AppThrottle 5000
"%NSSM_PATH%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRestartDelay 5000

:: Set dependency on MIOCardService (start after Node.js)
"%NSSM_PATH%" set "%SERVICE_NAME%" DependOnService MIOCardService

echo [OK] Service installed successfully

echo.
echo ==========================================
echo    Installation Complete!
echo ==========================================
echo.
echo Service Name: %SERVICE_NAME%
echo Display Name: %DISPLAY_NAME%
echo Startup Type: Automatic
echo Natapp Path:  !NATAPP_PATH!
echo Working Dir:  %PROJECT_DIR%\natapp\
echo Logs Dir:     %PROJECT_DIR%\logs\
echo Dependency:   MIOCardService (Node.js service must be running)
echo.
echo ==========================================
echo    Next Steps
echo ==========================================
echo.
echo 1. Make sure Node.js service is installed:
echo    - Run: install-service.bat
echo.
echo 2. Start natapp service:
echo    - Run: start-natapp-service.bat
echo    - Or:  net start %SERVICE_NAME%
echo.
echo 3. Check status:
echo    - Run: status-natapp-service.bat
echo    - Or:  sc query %SERVICE_NAME%
echo.
echo 4. Start both services:
echo    - Run: start-all-services.bat
echo.
echo Note: Natapp will start automatically after Node.js service
echo       because of service dependency configuration.
echo.
pause

