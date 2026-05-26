@echo off
setlocal
set EMU=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe
set AVD=Small_Phone

if not exist "%EMU%" (
    echo [ERROR] Android emulator not found at:
    echo   %EMU%
    echo Install Android SDK Emulator in Android Studio.
    pause
    exit /b 1
)

echo Stopping any running emulator...
adb emu kill 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting %AVD% with Google DNS (cold boot, no snapshot)...
echo Close Android Studio's emulator first if it is already open.
echo.
"%EMU%" -avd %AVD% -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load
