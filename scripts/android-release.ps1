# Release APK/AAB: ensures Windows hermesc + Android Studio JDK, then runs assembleRelease.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$hermesc = Join-Path $root "node_modules\hermes-compiler\hermesc\win64-bin\hermesc.exe"
if (-not (Test-Path $hermesc)) {
    Write-Host "Missing Windows Hermes compiler. Run: npm install" -ForegroundColor Red
    Write-Host "Expected: $hermesc" -ForegroundColor Gray
    exit 1
}

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

Write-Host "Building release APK (assembleRelease)..." -ForegroundColor Cyan
& "$root\android\gradlew.bat" -p "$root\android" assembleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apk = Join-Path $root "android\app\build\outputs\apk\release\app-release.apk"
Write-Host ""
Write-Host "BUILD SUCCESSFUL" -ForegroundColor Green
if (Test-Path $apk) {
    Write-Host "APK: $apk" -ForegroundColor Green
}
