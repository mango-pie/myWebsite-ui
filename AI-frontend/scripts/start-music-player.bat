@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title MIKU PULSE Launcher

set "PROJECT_DIR=E:\java_demo\Ai-scene\AI-backend\AI-frontend"

if not exist "%PROJECT_DIR%\package.json" (
    echo.
    echo [ERROR] Project folder not found:
    echo         %PROJECT_DIR%
    echo         Edit PROJECT_DIR in this script if needed.
    echo.
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%" || (
    echo [ERROR] Cannot cd to project folder.
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo.
    echo [INFO] First run: installing frontend dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        echo.
        pause
        exit /b 1
    )
)

call :ensure_api
call :ensure_meting
goto menu

:ensure_api
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo [OK] NetEase API already listening on port 3000
    goto :eof
)

if not exist "%PROJECT_DIR%\api-enhanced\package.json" (
    echo.
    echo [WARN] api-enhanced not found. NetEase features will be unavailable.
    echo        Repo: https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced
    echo.
    goto :eof
)

if not exist "%PROJECT_DIR%\api-enhanced\node_modules\" (
    echo.
    echo [INFO] First run: installing api-enhanced dependencies...
    pushd "%PROJECT_DIR%\api-enhanced"
    call npm install --production
    popd
    if errorlevel 1 (
        echo [ERROR] api-enhanced npm install failed.
        goto :eof
    )
)

echo [..] Starting NetEase API on port 3000...
start "MIKU-PULSE-API" /min /D "%PROJECT_DIR%\api-enhanced" cmd /k "node app.js"

echo [..] Waiting for API...
set "api_ready=0"
for /l %%i in (1,1,10) do (
    if "!api_ready!"=="0" (
        ping -n 2 127.0.0.1 >nul
        netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
        if not errorlevel 1 set "api_ready=1"
    )
)

if "!api_ready!"=="1" (
    echo [OK] NetEase API ready [port 3000]
) else (
    echo [WARN] API did not become ready. Check the minimized window logs.
)
goto :eof

:ensure_meting
netstat -ano | findstr ":3300 " | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo [OK] meting-lite already listening on port 3300
    goto :eof
)

if not exist "%PROJECT_DIR%\meting-lite\server.js" (
    echo.
    echo [WARN] meting-lite\server.js not found. QQ Music / Kugou features unavailable.
    echo.
    goto :eof
)

echo [..] Starting meting-lite on port 3300...
start "MIKU-PULSE-METING" /min /D "%PROJECT_DIR%\meting-lite" cmd /k "node server.js"

echo [..] Waiting for meting-lite...
set "meting_ready=0"
for /l %%i in (1,1,10) do (
    if "!meting_ready!"=="0" (
        ping -n 2 127.0.0.1 >nul
        netstat -ano | findstr ":3300 " | findstr "LISTENING" >nul
        if not errorlevel 1 set "meting_ready=1"
    )
)

if "!meting_ready!"=="1" (
    echo [OK] meting-lite ready [port 3300]
) else (
    echo [WARN] meting-lite did not become ready. Check the minimized window logs.
)
goto :eof

:menu
cls
echo ============================================
echo            MIKU PULSE Launcher
echo ============================================
echo.

netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo   NetEase API: stopped
) else (
    echo   NetEase API: running [port 3000]
)

netstat -ano | findstr ":3300 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo   meting-lite: stopped
) else (
    echo   meting-lite: running [port 3300]
)

echo.
echo   [1] Dev mode          Vite + hot reload
echo   [2] Preview mode      Build then preview
echo   [3] Desktop app       Tauri window (needs Rust)
echo   [4] Build installer   Windows installer
echo   [5] API only          NetEase API foreground
echo   [0] Exit
echo.
set "choice="
set /p "choice=Enter number then Enter: "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto preview
if "%choice%"=="3" goto tauri
if "%choice%"=="4" goto bundle
if "%choice%"=="5" goto api_only
if "%choice%"=="0" exit /b 0
goto menu

:dev
cls
echo.
echo Starting music player in dev mode...
echo Close this window to stop the frontend.
echo.
call npm run dev:music
goto end

:preview
cls
echo.
echo Building music player...
echo.
call npm run build:music
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed.
    echo.
    pause
    goto menu
)
echo.
echo Build done. Starting preview server...
echo.
call npm run preview:music -- --open /music.html
goto end

:tauri
cls
echo.
echo Starting Tauri desktop app. First run may take a while.
echo If Rust is missing: https://rustup.rs/
echo.
call npm run tauri:dev
goto end

:bundle
cls
echo.
echo Building Windows installer. First run may take a while.
echo.
call npm run tauri:build
if errorlevel 1 (
    echo.
    echo [ERROR] Bundle failed. Usually missing Rust or MSVC build tools.
    echo.
    pause
    goto menu
)
echo.
echo Done. Installer folder:
echo   %PROJECT_DIR%\src-tauri\target\release\bundle
echo.
start "" "%PROJECT_DIR%\src-tauri\target\release\bundle"
pause
goto menu

:api_only
cls
echo.
echo Starting NetEase API. Press Ctrl+C to stop...
echo.
pushd "%PROJECT_DIR%\api-enhanced"
node app.js
popd
goto end

:end
echo.
echo Process stopped.
echo.
pause
endlocal
