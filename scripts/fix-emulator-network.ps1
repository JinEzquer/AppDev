# Fix Android emulator network for Google sign-in + API (run with emulator already booted).
$ErrorActionPreference = "Continue"

Write-Host "=== Ezquerdev emulator network fix ===" -ForegroundColor Cyan

$devices = adb devices 2>$null | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
if (-not $devices) {
    Write-Host "[ERROR] No emulator/device. Start Small_Phone (or your AVD) first." -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Port forwarding (API + Metro)..." -ForegroundColor Yellow
adb reverse tcp:8000 tcp:8000 | Out-Null
adb reverse tcp:8081 tcp:8081 | Out-Null
adb reverse --list

Write-Host "`n2. Disable Private DNS (common DNS_PROBE cause)..." -ForegroundColor Yellow
adb shell settings put global private_dns_mode off | Out-Null
adb shell settings put global private_dns_specifier none | Out-Null
Write-Host "   private_dns_mode = $(adb shell settings get global private_dns_mode)"

Write-Host "`n3. Toggle Wi-Fi..." -ForegroundColor Yellow
adb shell svc wifi disable | Out-Null
Start-Sleep -Seconds 2
adb shell svc wifi enable | Out-Null
Start-Sleep -Seconds 4

Write-Host "`n4. Connectivity test..." -ForegroundColor Yellow
$pingIp = adb shell ping -c 1 -W 4 8.8.8.8 2>&1 | Out-String
$pingGoogle = adb shell ping -c 1 -W 4 accounts.google.com 2>&1 | Out-String

$ipOk = $pingIp -match "1 received"
$dnsOk = $pingGoogle -match "1 received"

if ($ipOk) {
    Write-Host "   Ping 8.8.8.8: OK" -ForegroundColor Green
} else {
    Write-Host "   Ping 8.8.8.8: FAILED (emulator has no internet through your PC)" -ForegroundColor Red
}

if ($dnsOk) {
    Write-Host "   Ping accounts.google.com: OK — Google sign-in should work." -ForegroundColor Green
} else {
    Write-Host "   Ping accounts.google.com: FAILED — Google sign-in will not work in emulator." -ForegroundColor Red
}

if (-not $ipOk) {
    Write-Host ""
    Write-Host "=== Emulator still offline - do this on Windows ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your PC HAS internet; the emulator virtual network is broken."
    Write-Host "You have VirtualBox + WSL adapters - they often block the emulator."
    Write-Host ""
    Write-Host "TRY THIS ORDER:" -ForegroundColor Cyan
    Write-Host "  1. Close emulator completely"
    Write-Host "  2. Win+R -> ncpa.cpl -> Enter"
    Write-Host "     Right-click 'VirtualBox Host-Only' -> Disable (temporary)"
    Write-Host "  3. Run:  Ezquerdev\start-emulator-cold.bat"
    Write-Host "     (starts Small_Phone with Google DNS, cold boot)"
    Write-Host "  4. When emulator is up, run:  fix-emulator-network.bat"
    Write-Host "     Ping 8.8.8.8 should say OK"
    Write-Host ""
    Write-Host "If still FAILED:"
    Write-Host "  - Turn off VPN on PC"
    Write-Host "  - Firewall: allow Android Emulator + qemu-system-*"
    Write-Host "  - Android Studio -> Device Manager -> Wipe Data on Small_Phone"
    Write-Host "  - Or use a REAL phone: adb reverse tcp:8000 tcp:8000"
    Write-Host ""
    Write-Host "Until fixed: use Email/Password in the app (no Google needed)."
    Write-Host "Keep PatricksColdCut\start_server.bat running."
    Write-Host ""
    exit 2
}

Write-Host "`nDone. Try Google sign-in again in the app." -ForegroundColor Green
exit 0
