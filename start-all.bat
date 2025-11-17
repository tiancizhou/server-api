@echo off
chcp 65001 >nul
title 一键启动 - MIO 卡片激活服务
color 0A

echo ==========================================
echo    🚀 MIO 卡片激活服务 - 一键启动
echo ==========================================
echo.

:: 检查 Node.js
echo [1/4] 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常
echo.

:: 检查依赖
if not exist "node_modules" (
    echo [2/4] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo.
) else (
    echo [2/4] ✅ 依赖已安装
    echo.
)

:: 检查 natapp
echo [3/4] 检查 natapp.exe...

:: 尝试多个可能的路径（优先使用项目目录）
set NATAPP_PATH=
if exist "%~dp0natapp\natapp.exe" set NATAPP_PATH=%~dp0natapp\natapp.exe
if exist "%~dp0natapp.exe" set NATAPP_PATH=%~dp0natapp.exe
if exist "C:\tools\natapp\natapp.exe" set NATAPP_PATH=C:\tools\natapp\natapp.exe
if exist "C:\Tools\natapp.exe" set NATAPP_PATH=C:\Tools\natapp.exe
if exist "%USERPROFILE%\Desktop\natapp.exe" set NATAPP_PATH=%USERPROFILE%\Desktop\natapp.exe
if exist "%USERPROFILE%\Downloads\natapp.exe" set NATAPP_PATH=%USERPROFILE%\Downloads\natapp.exe

if "%NATAPP_PATH%"=="" (
    echo [X] 警告：未找到 natapp.exe
    echo.
    echo 已尝试查找以下位置：
    echo   - 项目目录\natapp\natapp.exe
    echo   - 项目目录\natapp.exe
    echo   - C:\tools\natapp\natapp.exe
    echo   - C:\Tools\natapp.exe
    echo   - 桌面\natapp.exe
    echo   - 下载文件夹\natapp.exe
    echo.
    echo 💡 解决方法：
    echo   1. 将 natapp.exe 复制到以上任一位置
    echo   2. 或手动编辑本脚本，设置正确路径
    echo   3. 或仅启动本地服务器（继续等待...）
    echo.
    choice /C YN /T 5 /D N /M "是否仅启动本地服务器（5秒后自动选择"是"）"
    if errorlevel 2 (
        echo.
        echo 已取消启动
        pause
        exit /b 0
    )
    goto :start_server_only
)
echo ✅ natapp.exe 已找到: %NATAPP_PATH%
echo.

:: 同时启动两个服务
echo [4/4] 启动服务...
echo.
echo ==========================================
echo    📌 本地服务: http://localhost:5200
echo    📌 内网穿透: natapp 窗口查看地址
echo ==========================================
echo.
echo 提示：
echo  - 两个服务将在独立窗口中运行
echo  - 关闭任意窗口可停止对应服务
echo  - 关闭本窗口不会影响服务运行
echo.
timeout /t 2 >nul

:: 在新窗口启动 Node 服务器
echo 正在启动 Node.js 服务器...
start "MIO 服务器 - http://localhost:5200" /D "%~dp0" cmd /k "color 0B && echo 🟢 MIO 服务器正在运行... && echo 地址: http://localhost:5200 && echo. && node server.js"

:: 等待服务器完全启动
echo 等待服务器启动（5秒）...
timeout /t 5 >nul

:: 测试服务器是否已启动
echo 检测服务器状态...
curl -s http://localhost:5200 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ 服务器已成功启动
) else (
    echo [!] 警告：无法连接到服务器，但继续启动 natapp...
)
echo.

:: 在新窗口启动 natapp
echo 正在启动 natapp 内网穿透...
start "内网穿透 - natapp" cmd /k "color 0E && echo 🌐 内网穿透正在运行... && echo. && "%NATAPP_PATH%""

echo.
echo ✅ 所有服务已启动！
echo.
echo 💡 温馨提示：
echo  - 本地测试访问: http://localhost:5200
echo  - 外网访问地址: 请查看 natapp 窗口
echo  - 双击标题可显示测试模式面板
echo.
echo 按任意键关闭本窗口（不会停止已启动的服务）...
pause >nul
exit /b 0

:start_server_only
:: 仅启动 Node 服务器
echo [4/4] 启动本地服务器...
echo.
echo ==========================================
echo    📌 本地服务: http://localhost:5200
echo    ⚠️ 仅本地访问（无内网穿透）
echo ==========================================
echo.
echo 提示：
echo  - 服务将在新窗口中运行
echo  - 关闭服务窗口可停止服务
echo.
timeout /t 2 >nul

:: 在新窗口启动 Node 服务器
start "MIO 服务器 - http://localhost:5200" /D "%~dp0" cmd /k "color 0B && echo 🟢 MIO 服务器正在运行... && echo 地址: http://localhost:5200 && echo. && node server.js"

echo.
echo ✅ 本地服务器已启动！
echo.
echo 💡 温馨提示：
echo  - 本地访问: http://localhost:5200
echo  - 如需外网访问，请手动启动内网穿透工具
echo.
echo 按任意键关闭本窗口（不会停止服务器）...
pause >nul

