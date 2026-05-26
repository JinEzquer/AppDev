@echo off
echo ========================================
echo  Patrick's - Web + Mobile together
echo ========================================
echo.
echo Step 1: Start the server (new window)
echo   PatricksColdCut\start_server.bat  ^(keep it open^)
echo.
echo Step 2: Port forward (Metro + Google OAuth on 127.0.0.1)
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
if %errorlevel% neq 0 (
    echo [WARN] adb failed - start the emulator first for Metro forward, or reload app.
) else (
    echo adb reverse 8081 OK ^(Metro only^)
    adb reverse --list
)
echo.
echo Step 3: Open admin in browser (HTTP)
start "" "http://127.0.0.1:8000/admin"
echo.
echo Step 4: Mobile app
echo   - Metro:  npm start   (in Ezquerdev folder)
echo   - Install: npm run android
echo   - In app: Shop -^> order -^> check Admin -^> Orders
echo.
pause
