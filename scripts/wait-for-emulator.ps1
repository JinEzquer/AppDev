# Wait until adb reports at least one device in "device" state (not offline/authorizing).
param([int]$MaxSeconds = 120)

$deadline = (Get-Date).AddSeconds($MaxSeconds)
Write-Host "Waiting for Android emulator to be ready..."

while ((Get-Date) -lt $deadline) {
    $lines = adb devices 2>$null | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
    foreach ($line in $lines) {
        if ($line -match '\s+device$') {
            Write-Host "Emulator ready: $line"
            exit 0
        }
    }
    Start-Sleep -Seconds 3
}

Write-Host "Timed out. Run: adb kill-server && adb start-server && adb devices"
exit 1
