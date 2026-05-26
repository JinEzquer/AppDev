@echo off
REM Use npm run android (adb reverse + Metro on 8081). Do not use raw npx run-android.
cd /d "%~dp0"
call npm run android
