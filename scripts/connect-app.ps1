# Use when Metro is ALREADY running but shows "No apps connected".
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== Connect app to Metro ===" -ForegroundColor Cyan

& "$PSScriptRoot\ensure-emulator.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

adb reverse tcp:8081 tcp:8081 | Out-Null
adb reverse tcp:8000 tcp:8000 | Out-Null
Write-Host "adb reverse: 8081, 8000" -ForegroundColor Green

$installed = adb shell pm path com.ezquerdev 2>$null
if (-not $installed) {
    Write-Host "App not installed. Running full build..." -ForegroundColor Yellow
    npx react-native run-android --port 8081 --no-packager
} else {
    Write-Host "Launching app..." -ForegroundColor Yellow
    adb shell am force-stop com.ezquerdev | Out-Null
    adb shell am start -n com.ezquerdev/.MainActivity | Out-Null
}

Start-Sleep -Seconds 5
Write-Host "Opening Dev Menu (shake menu) - tap Reload if needed..." -ForegroundColor Yellow
adb shell input keyevent 82 | Out-Null
Start-Sleep -Seconds 1
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8081/reload" -Method POST -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "Reload sent to Metro." -ForegroundColor Green
} catch {
    Write-Host "In Metro window press the r key to reload." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. You should see a CREAM screen (not black), then the shop." -ForegroundColor Green
Write-Host "Metro 'No apps connected' is OK until the bundle loads; press r in Metro after the app opens." -ForegroundColor Cyan
