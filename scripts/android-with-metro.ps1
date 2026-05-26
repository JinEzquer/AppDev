# Ensures Metro + adb reverse before launching the app (prevents black emulator screen).
param(
    [switch]$CleanMetro
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Test-MetroRunning {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8081/status" -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-Metro {
    param([int]$Seconds = 60)
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-MetroRunning) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host "=== Android + Metro ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Metro window is SUPPOSED to be black/dark - that is normal." -ForegroundColor Gray
Write-Host "No apps connected = emulator not running or app not installed yet." -ForegroundColor Gray
Write-Host ""

& "$PSScriptRoot\ensure-emulator.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

adb start-server | Out-Null
adb reverse tcp:8081 tcp:8081 | Out-Null
adb reverse tcp:8000 tcp:8000 | Out-Null
Write-Host "adb reverse: 8081 (Metro), 8000 (API)" -ForegroundColor Green

if (-not (Test-MetroRunning)) {
    Write-Host "Metro is not running - starting it now..." -ForegroundColor Yellow
    $metroCmd = if ($CleanMetro) { "npm run start:clean" } else { "npm run start" }
    $metroLaunch = "Set-Location -LiteralPath '$root'; $metroCmd"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroLaunch
    if (-not (Wait-Metro -Seconds 90)) {
        Write-Host "ERROR: Metro did not start on port 8081. Check the Metro window for errors." -ForegroundColor Red
        exit 1
    }
    Write-Host "Metro is ready on http://127.0.0.1:8081" -ForegroundColor Green
} else {
    Write-Host "Metro already running on port 8081" -ForegroundColor Green
}

# Android Studio JBR avoids PKIX errors some system JDKs hit on Maven HTTPS
$jbrCandidates = @(
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr",
    "${env:ProgramFiles}\Android\Android Studio\jbr"
)
foreach ($jbr in $jbrCandidates) {
    if (Test-Path (Join-Path $jbr "bin\java.exe")) {
        $env:JAVA_HOME = $jbr
        break
    }
}

Write-Host "Building and installing app..." -ForegroundColor Yellow
npx react-native run-android --port 8081 --no-packager
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 3
Write-Host "Reloading app..." -ForegroundColor Yellow
adb shell am force-stop com.ezquerdev | Out-Null
adb shell am start -n com.ezquerdev/.MainActivity | Out-Null

Start-Sleep -Seconds 2
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8081/reload" -Method POST -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "Sent reload to Metro." -ForegroundColor Green
} catch {
    Write-Host "Tip: In Metro window press r to reload after the app opens." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "App launched. Metro should show BUNDLE ./index.js when connected." -ForegroundColor Green
Write-Host "If still blank: Ctrl+M in emulator -> Reload" -ForegroundColor Green
Write-Host "Keep the Metro window open while developing." -ForegroundColor Cyan
