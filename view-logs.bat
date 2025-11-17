@echo off
title Log Viewer
color 0E

:menu
cls
echo ==========================================
echo    Log Viewer
echo ==========================================
echo.

if not exist "logs" (
    echo ERROR: logs folder not found
    echo.
    pause
    exit /b
)

echo Log files:
echo.
dir /b logs\node-*.log 2>nul
echo.

if errorlevel 1 (
    echo No log files found
    pause
    exit /b
)

echo ==========================================
echo    Options
echo ==========================================
echo.
echo   1 - Open logs folder
echo   2 - View latest log
echo   3 - Clean old logs
echo   0 - Exit
echo.
set /p choice=Select: 

if "%choice%"=="0" exit /b
if "%choice%"=="1" goto open
if "%choice%"=="2" goto view
if "%choice%"=="3" goto clean

echo Invalid choice
timeout /t 2 >nul
goto menu

:open
start explorer "%~dp0logs"
timeout /t 1 >nul
goto menu

:view
for /f "delims=" %%f in ('dir /b /o-d logs\node-*.log 2^>nul') do (
    start notepad "%~dp0logs\%%f"
    goto menu
)
echo File not found
pause
goto menu

:clean
echo.
echo Deleting logs older than 3 days...
forfiles /P "logs" /M "node-*.log" /D -3 /C "cmd /c del @path" 2>nul
if errorlevel 1 (
    echo No files to clean
) else (
    echo Done
)
pause
goto menu
