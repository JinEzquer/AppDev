# Configures Gradle to use Android Studio's JDK + trust store, then verifies Maven over Java (not PowerShell).
# Run from project root: npm run fix:android-ssl
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Find-AndroidStudioJbr {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr",
        "${env:ProgramFiles}\Android\Android Studio\jbr",
        "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
    )
    foreach ($p in $candidates) {
        if (Test-Path (Join-Path $p "bin\java.exe")) { return $p }
    }
    return $null
}

function Test-JavaHttps {
    param([string]$Jbr, [string]$Url)
    $java = Join-Path $Jbr "bin\java.exe"
    $javac = Join-Path $Jbr "bin\javac.exe"
    $cacerts = Join-Path $Jbr "lib\security\cacerts"
    $code = @"
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
public class H {
  public static void main(String[] a) throws Exception {
    var c = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
    var r = c.send(HttpRequest.newBuilder().uri(URI.create(a[0])).HEAD().build(),
      HttpResponse.BodyHandlers.discarding());
    System.out.print(r.statusCode());
  }
}
"@
    $tmpdir = Join-Path $env:TEMP "ezquerdev-ssl-check"
    New-Item -ItemType Directory -Force -Path $tmpdir | Out-Null
    $src = Join-Path $tmpdir "H.java"
    Set-Content -Path $src -Value $code -Encoding ASCII
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $compileOut = cmd /c "`"$javac`" -d `"$tmpdir`" `"$src`" 2>&1"
    if ($LASTEXITCODE -ne 0) {
        $ErrorActionPreference = $prevEap
        return @{ Ok = $false; Detail = "javac failed: $compileOut" }
    }
    $out = cmd /c "`"$java`" -Djavax.net.ssl.trustStore=`"$cacerts`" -Djavax.net.ssl.trustStorePassword=changeit -cp `"$tmpdir`" H `"$Url`" 2>&1"
    $exit = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    $text = ($out | Out-String).Trim()
    if ($exit -ne 0 -or $text -notmatch '^\d+$') {
        return @{ Ok = $false; Detail = $text }
    }
    $status = [int]$text
    return @{ Ok = ($status -ge 200 -and $status -lt 400); Detail = "HTTP $status" }
}

Write-Host "=== Android Gradle SSL check ===" -ForegroundColor Cyan
Write-Host ""

$jbr = Find-AndroidStudioJbr
if (-not $jbr) {
    Write-Host "Android Studio JBR not found. Install Android Studio or set JAVA_HOME to JDK 17+." -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $jbr
Write-Host "JAVA_HOME -> $jbr" -ForegroundColor Green
$java = Join-Path $jbr "bin\java.exe"
$ver = cmd /c "`"$java`" -version 2>&1"
if ($ver) { Write-Host $ver }

$gradleProps = Join-Path $root "android\gradle.properties"
$lines = @()
if (Test-Path $gradleProps) {
    $lines = Get-Content $gradleProps | Where-Object {
        $_ -notmatch '^org\.gradle\.java\.home=' -and
        $_ -notmatch '^systemProp\.javax\.net\.ssl\.trustStore'
    }
}

$cacerts = Join-Path $jbr "lib\security\cacerts"
if (Test-Path $cacerts) {
    $lines += "org.gradle.java.home=$($jbr -replace '\\', '/')"
    $lines += "systemProp.javax.net.ssl.trustStore=$($cacerts -replace '\\', '/')"
    $lines += "systemProp.javax.net.ssl.trustStorePassword=changeit"
    Set-Content -Path $gradleProps -Value ($lines -join "`n") -Encoding UTF8
    Write-Host ""
    Write-Host "Updated android/gradle.properties (Gradle uses Android Studio JDK + cacerts)." -ForegroundColor Green
}

Write-Host ""
Write-Host "--- Gradle / Java (used for npm run android) ---" -ForegroundColor Cyan
$javaUrls = @(
    @{ Label = "Google Maven"; Url = "https://dl.google.com/dl/android/maven2/androidx/annotation/annotation/maven-metadata.xml" },
    @{ Label = "Maven Central"; Url = "https://repo.maven.apache.org/maven2/" }
)
$javaOk = $true
foreach ($item in $javaUrls) {
    $r = Test-JavaHttps -Jbr $jbr -Url $item.Url
    if ($r.Ok) {
        Write-Host "OK   $($item.Label)  $($r.Detail)" -ForegroundColor Green
    } else {
        Write-Host "FAIL $($item.Label)  $($r.Detail)" -ForegroundColor Red
        $javaOk = $false
    }
}

Write-Host ""
Write-Host "--- Windows PowerShell (informational only; not used by Gradle) ---" -ForegroundColor DarkGray
foreach ($url in @("https://repo.maven.apache.org/maven2/")) {
    try {
        $null = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10
        Write-Host "OK   $url" -ForegroundColor DarkGray
    } catch {
        Write-Host "FAIL $url" -ForegroundColor DarkYellow
        Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkGray
        Write-Host "     (Antivirus often breaks PowerShell HTTPS but Java/Gradle still works.)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Running quick Gradle dependency check..." -ForegroundColor Cyan
$gradlew = Join-Path $root "android\gradlew.bat"
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $gradlew -p (Join-Path $root "android") :app:dependencies --configuration debugRuntimeClasspath -q 2>&1 | Out-Null
$gradleExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap

if ($gradleExit -eq 0) {
    Write-Host "OK   Gradle resolved debugRuntimeClasspath" -ForegroundColor Green
} else {
    Write-Host "FAIL Gradle could not resolve dependencies (exit $gradleExit)" -ForegroundColor Red
    $javaOk = $false
}

Write-Host ""
if ($javaOk -and $gradleExit -eq 0) {
    Write-Host "You are set. Build with:  npm run android" -ForegroundColor Green
    Write-Host "Avoid bare: npx react-native run-android (skips Metro + JDK setup)." -ForegroundColor Gray
    exit 0
}

Write-Host "Gradle/Java HTTPS still failing on this PC." -ForegroundColor Red
Write-Host "Try:" -ForegroundColor Yellow
Write-Host "  1. Temporarily disable HTTPS scanning in antivirus for java.exe under Android Studio\jbr" -ForegroundColor Yellow
Write-Host "  2. School/work network: import proxy root cert into JBR cacerts (keytool -importcert)" -ForegroundColor Yellow
Write-Host "  3. After a successful build once, retry with cached deps: android\gradlew.bat -p android --offline app:installDebug" -ForegroundColor Yellow
exit 1
