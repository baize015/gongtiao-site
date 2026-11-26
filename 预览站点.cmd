@echo off
chcp 936 >nul
title 本地预览
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

if not exist "node_modules" (
  echo.
  echo  第一次运行，正在安装依赖，大约需要一两分钟……
  call npm install
  if errorlevel 1 (
    echo.
    echo  [x] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo.
echo  正在启动本地预览：http://localhost:3000
echo  关闭这个窗口就会停止服务器。
echo.

if not "%GT_NO_OPEN%"=="1" (
  start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 7; Start-Process 'http://localhost:3000'"
)

call npm run dev

pause
