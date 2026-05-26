# Fixes black emulator screen: reset Metro, port forward, reinstall app.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "=== Fix black emulator screen ===" -ForegroundColor Cyan

Write-Host "Stopping Metro on port 8081..."
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  ForEach-Object {
    $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -match 'node') {
      Write-Host "  Killing $($p.ProcessName) (PID $($p.Id))"
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
  }
Start-Sleep -Seconds 2

& "$PSScriptRoot\android-with-metro.ps1" -CleanMetro
