@echo off
cd /d "%~dp0"
echo Setting up Android emulator for Google sign-in + API...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\fix-emulator-network.ps1"
echo.
echo Next:
echo   1. Keep PatricksColdCut\start_server.bat running
echo   2. In the app: Sign in with Google again
echo   3. If ping failed above, run fix-emulator-network.bat after Cold Boot
echo   4. Or use email/password in the app (works without Google)
pause
