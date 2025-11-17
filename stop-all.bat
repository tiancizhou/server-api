@echo off
chcp 65001 >nul
title 停止所有服务
color 0C

echo ==========================================
echo    🛑 停止所有服务
echo ==========================================
echo.

echo 正在查找并停止服务...
echo.

:: 停止 Node.js 进程
tasklist | find /I "node.exe" >nul
if %errorlevel% equ 0 (
    echo [1/2] 停止 Node.js 服务器...
    taskkill /F /IM node.exe >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Node.js 服务器已停止
    ) else (
        echo ⚠️ 无法停止 Node.js 服务器（可能需要管理员权限）
    )
) else (
    echo [1/2] ℹ️ Node.js 服务器未运行
)
echo.

:: 停止 natapp 进程
tasklist | find /I "natapp.exe" >nul
if %errorlevel% equ 0 (
    echo [2/2] 停止 natapp 内网穿透...
    taskkill /F /IM natapp.exe >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ natapp 已停止
    ) else (
        echo ⚠️ 无法停止 natapp（可能需要管理员权限）
    )
) else (
    echo [2/2] ℹ️ natapp 未运行
)
echo.

echo ==========================================
echo    ✅ 所有服务已停止
echo ==========================================
echo.

timeout /t 3

