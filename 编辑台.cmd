@echo off
chcp 936 >nul
title 编辑台
setlocal
cd /d "%~dp0"

set "LOCALNODE=%~dp0..\.toolchain\node"
if exist "%LOCALNODE%\node.exe" (
  set "PATH=%LOCALNODE%;%PATH%"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo.
    echo  [x] 没找到 Node.js。
    echo      请先安装 Node.js 20.9 或更新版本：https://nodejs.org
    echo.
    pause
    exit /b 1
  )
)

if not exist ".tmp" mkdir ".tmp"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
set "NEXT_TELEMETRY_DISABLED=1"

if not exist "node_modules" (
  echo  第一次启动，正在安装依赖，大概一两分钟……
  call npm install
  if errorlevel 1 (
    echo.
    echo  [x] 依赖安装失败，请检查网络。
    pause
    exit /b 1
  )
)

call npm run studio
echo.
echo  编辑台已停止。
pause
