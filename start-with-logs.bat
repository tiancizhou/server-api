@echo off
chcp 65001 >nul
title MIO 卡片激活服务 (日志记录)
color 0B

echo ==========================================
echo    MIO 卡片激活服务 - 带日志
echo ==========================================
echo.

:: 检查 Node.js
echo [1/4] 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] 错误：未检测到 Node.js
    pause
    exit /b 1
)
echo [OK] Node.js 环境正常
echo.

:: 检查依赖
if not exist "node_modules" (
    echo [2/4] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
) else (
    echo [2/4] [OK] 依赖已安装
    echo.
)

:: 创建日志目录
echo [3/4] 准备日志目录...
if not exist "logs" mkdir logs
echo [OK] 日志目录: %~dp0logs
echo.

:: 生成日志文件名（带时间戳）
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list 2^>nul') do set datetime=%%I
if not defined datetime (
    set LOG_DATE=latest
) else (
    set LOG_DATE=%datetime:~0,8%-%datetime:~8,6%
)
set NODE_LOG=%~dp0logs\node-%LOG_DATE%.log

echo 日志文件: logs\node-%LOG_DATE%.log
echo.

:: 检查 natapp（优先使用项目目录）
echo [4/4] 检查 natapp.exe...
set NATAPP_PATH=
if exist "%~dp0natapp\natapp.exe" set NATAPP_PATH=%~dp0natapp\natapp.exe
if exist "%~dp0natapp.exe" set NATAPP_PATH=%~dp0natapp.exe
if exist "C:\tools\natapp\natapp.exe" set NATAPP_PATH=C:\tools\natapp\natapp.exe
if exist "C:\Tools\natapp.exe" set NATAPP_PATH=C:\Tools\natapp.exe

if "%NATAPP_PATH%"=="" (
    echo [!] 未找到 natapp.exe
    goto :server_only
)
echo [OK] natapp.exe 已找到
echo.

:: 启动服务（双窗口）
echo ==========================================
echo    启动服务...
echo ==========================================
echo.
echo 本地服务: http://localhost:5200
echo 日志文件: logs\node-%LOG_DATE%.log
echo.
timeout /t 2 >nul

:: 写入日志头
echo ========================================== > "%NODE_LOG%"
echo MIO 卡片激活服务 - Node.js 日志 >> "%NODE_LOG%"
echo 启动时间: %date% %time% >> "%NODE_LOG%"
echo ========================================== >> "%NODE_LOG%"
echo. >> "%NODE_LOG%"

:: 启动 Node.js 服务器（新窗口 + 日志）
echo 正在启动 Node.js 服务器...
start "Node.js 服务器" cmd /c "echo [Node.js] 服务器运行中 && echo 日志: %NODE_LOG% && echo. && node server.js >> "%NODE_LOG%" 2>&1"

:: 等待服务器启动
timeout /t 3 >nul

:: 启动 natapp（新窗口，不记录日志）
echo 正在启动 natapp 内网穿透...
start "natapp 内网穿透" cmd /c "echo [natapp] 内网穿透运行中 && echo. && "%NATAPP_PATH%""

echo.
echo [OK] 所有服务已启动
echo.
echo 提示：
echo   - Node 服务器日志保存到: logs\node-%LOG_DATE%.log
echo   - natapp 不记录日志
echo.
echo 快速操作：
echo   [1] 打开日志文件夹
echo   [2] 查看 Node 日志
echo   直接回车 = 关闭本窗口
echo.
set /p choice="请选择: "

if "%choice%"=="1" start explorer "%~dp0logs"
if "%choice%"=="2" if exist "%NODE_LOG%" start notepad "%NODE_LOG%"

exit /b 0

:server_only
:: 仅启动服务器模式
echo.
echo ==========================================
echo    启动本地服务器...
echo ==========================================
echo.
echo 本地服务: http://localhost:5200
echo 日志文件: logs\node-%LOG_DATE%.log
echo.
timeout /t 2 >nul

:: 写入日志头
echo ========================================== > "%NODE_LOG%"
echo MIO 卡片激活服务 - Node.js 日志 >> "%NODE_LOG%"
echo 启动时间: %date% %time% >> "%NODE_LOG%"
echo ========================================== >> "%NODE_LOG%"
echo. >> "%NODE_LOG%"

start "Node.js 服务器" cmd /c "echo [Node.js] 服务器运行中 && echo 日志: %NODE_LOG% && echo. && node server.js >> "%NODE_LOG%" 2>&1"

echo [OK] 服务器已启动
echo.
echo 快速操作：
echo   [1] 打开日志文件
echo   直接回车 = 关闭本窗口
echo.
set /p choice="请选择: "
if "%choice%"=="1" if exist "%NODE_LOG%" start notepad "%NODE_LOG%"

