@echo off
chcp 65001 >nul
echo ==========================================
echo    MIO 卡片激活服务
echo ==========================================
echo.

echo 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 环境正常
echo.

if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo 启动服务...
echo.
echo ==========================================
echo    服务地址: http://localhost:5200
echo    按 Ctrl+C 可停止服务
echo ==========================================
echo.

node server.js

pause

