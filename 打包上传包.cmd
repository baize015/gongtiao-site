@echo off
chcp 936 >nul
title 打包上传包
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
  echo  第一次打包，先安装依赖……
  call npm install
  if errorlevel 1 (
    echo  [x] 依赖安装失败，请检查网络。
    pause
    exit /b 1
  )
)

echo.
echo ============================================
echo   正在生成静态站点并打包（约 1-2 分钟）
echo ============================================
echo.

call npm run build:static
if errorlevel 1 goto fail

echo.
echo ============================================
echo   完成！上传包已生成：
echo   %~dp0gongtiao-site.zip
echo.
echo   下一步：把这个 zip 拖进 EdgeOne 的「直接上传」
echo   注意：不要手动压缩 out 文件夹（Windows 自带压缩
echo         会写反斜杠路径，提交会报错）
echo ============================================
echo.
pause
exit /b 0

:fail
echo.
echo [失败] 上面的报错里通常写明了原因。
echo.
pause
exit /b 1
