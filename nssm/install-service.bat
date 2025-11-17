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

title Install MIO Card Service
color 0B

echo ==========================================
echo    MIO Card Service Installer
echo ==========================================
echo.

:: Set paths
set PROJECT_DIR=%~dp0..
set NSSM_PATH=%~dp0nssm.exe
set SERVICE_NAME=MIOCardService
set DISPLAY_NAME=MIO Card API Service

:: Check NSSM
echo [1/5] Checking NSSM...
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

:: Check Node.js
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Node.js not installed
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js !NODE_VERSION! found

:: Check if service exists
echo [3/5] Checking existing service...
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

:: Create logs directory
echo [4/5] Preparing directories...
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"
echo [OK] Directories ready

:: Install service
echo [5/5] Installing service...

:: Get Node.js path
for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i

:: Create log file name with timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list 2^>nul') do set datetime=%%I
if not defined datetime (
    set LOG_DATE=latest
) else (
    set LOG_DATE=!datetime:~0,8!-!datetime:~8,6!
)

:: Install NSSM service
"%NSSM_PATH%" install "%SERVICE_NAME%" "!NODE_PATH!" "server.js"

if %errorlevel% neq 0 (
    echo [X] ERROR: Service installation failed
    pause
    exit /b 1
)

:: Configure service
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "%DISPLAY_NAME%"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "MIO Card activation and transaction query API service"
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

:: Set working directory
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%PROJECT_DIR%"

:: Set log files
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%PROJECT_DIR%\logs\service-stdout.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%PROJECT_DIR%\logs\service-stderr.log"

:: Set log rotation
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdoutCreationDisposition 4
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderrCreationDisposition 4

:: Set restart behavior
"%NSSM_PATH%" set "%SERVICE_NAME%" AppThrottle 1000
"%NSSM_PATH%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRestartDelay 1000

echo [OK] Service installed successfully

echo.
echo ==========================================
echo    Installation Complete!
echo ==========================================
echo.
echo Service Name: %SERVICE_NAME%
echo Display Name: %DISPLAY_NAME%
echo Startup Type: Automatic
echo Working Dir:  %PROJECT_DIR%
echo Logs Dir:     %PROJECT_DIR%\logs\
echo.
echo ==========================================
echo    Next Steps
echo ==========================================
echo.
echo 1. Start service:
echo    - Run: start-service.bat
echo    - Or:  net start %SERVICE_NAME%
echo.
echo 2. Check status:
echo    - Run: sc query %SERVICE_NAME%
echo    - Or:  services.msc
echo.
echo 3. View logs:
echo    - Run: ..\view-logs.bat
echo    - Or:  Open logs folder
echo.
echo 4. Configure (optional):
echo    - Run: nssm.exe edit %SERVICE_NAME%
echo.
pause

