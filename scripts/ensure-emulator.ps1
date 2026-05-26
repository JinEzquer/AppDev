# Start the Android emulator if adb shows no device.
param(
    [string]$AvdName = "Small_Phone",
    [int]$WaitSeconds = 180
)

$ErrorActionPreference = "Continue"

function Get-AdbDeviceLines {
    adb devices 2>$null | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
}

function Test-EmulatorReady {
    foreach ($line in Get-AdbDeviceLines) {
        if ($line -match '\s+device$') {
            return $true
        }
    }
    return $false
}

if (Test-EmulatorReady) {
    Write-Host "Emulator already connected." -ForegroundColor Green
    Get-AdbDeviceLines | ForEach-Object { Write-Host "  $_" }
    exit 0
}

$emu = Join-Path $env:LOCALAPPDATA "Android\Sdk\emulator\emulator.exe"
if (-not (Test-Path $emu)) {
    Write-Host "ERROR: Android emulator not found at:" -ForegroundColor Red
    Write-Host "  $emu"
    Write-Host "Install Android Studio -> SDK Manager -> Android Emulator"
    exit 1
}

Write-Host "No emulator detected. Starting AVD: $AvdName ..." -ForegroundColor Yellow
Write-Host "(This can take 1-2 minutes on first boot.)" -ForegroundColor Gray

Start-Process -FilePath $emu -ArgumentList @("-avd", $AvdName, "-dns-server", "8.8.8.8,8.8.4.4")

& "$PSScriptRoot\wait-for-emulator.ps1" -MaxSeconds $WaitSeconds
exit $LASTEXITCODE
