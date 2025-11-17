@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Debug Mode
color 0E

cls
echo ==========================================
echo    Debug Mode
echo ==========================================
echo.

if not exist "logs" (
    echo ERROR: logs folder not found
    pause
    exit /b 0
)

echo Logs folder exists
echo.

set count=0
echo Finding log files...
for %%f in (logs\node-*.log) do (
    set /a count+=1
    echo   Found [!count!]: %%~nxf
)

echo.
echo Total files: !count!
echo.

if !count! equ 0 (
    echo No log files found
    pause
    exit /b 0
)

echo Showing menu...
echo.
echo ==========================================
echo    Options
echo ==========================================
echo.
echo   [1] Open logs folder
echo   [2] View log file
echo   [0] Exit
echo.
set /p choice="Select: "

if "%choice%"=="1" (
    start explorer "%~dp0logs"
    goto :end
)

if "%choice%"=="2" (
    for /f "delims=" %%f in ('dir /b /o-d logs\node-*.log 2^>nul') do (
        echo.
        echo Opening: %%f
        start notepad "%~dp0logs\%%f"
        goto :end
    )
    echo.
    echo ERROR: File not found
)

:end
echo.
pause
