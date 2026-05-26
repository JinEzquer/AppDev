@echo off
echo Connecting Ezquerdev mobile app to your PC server...
echo.

adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
if %errorlevel% neq 0 (
    echo [ERROR] adb failed. Start the Android emulator first.
    pause
    exit /b 1
)

echo.
echo Port forwarding OK:
adb reverse --list
echo.
echo 1. Keep PatricksColdCut\start_server.bat running
echo 2. In the emulator app, tap Try again
echo    OR press r in the Metro terminal to reload
echo.
pause
