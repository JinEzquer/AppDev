@echo off
echo ========================================
echo  Ezquerdev - Install on Android emulator
echo ========================================
echo.

adb kill-server >nul 2>&1
adb start-server
if %errorlevel% neq 0 (
    echo [ERROR] adb not found. Install Android SDK platform-tools.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\wait-for-emulator.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Start the emulator from Android Studio Device Manager, wait for the home screen,
    echo then run this script again.
    pause
    exit /b 1
)

adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
echo Ports reversed: 8081 Metro, 8000 Patrick's API

echo.
echo BEFORE install: Metro should be running on port 8081 (npm start)
echo If you see "dev server on 8082", stop the other Metro window first.
echo.

call npx react-native run-android --port 8081 --no-packager

if %errorlevel% neq 0 (
    echo.
    echo Install failed? Try:
    echo   1. Device Manager - Stop emulator - wait - Play to start
    echo   2. adb kill-server ^&^& adb start-server
    echo   3. Run this bat again when home screen is visible
    pause
    exit /b 1
)

echo.
echo Done. In emulator: open Ezquerdev app. Reload with Ctrl+M - Reload if needed.
pause
