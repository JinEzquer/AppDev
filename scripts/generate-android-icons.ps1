# Trims logo padding, saves src/assets/logo.png, generates adaptive + legacy launcher icons.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$sourceCandidates = @(
    (Join-Path $root "src\assets\logo.png"),
    (Join-Path $root "..\PatricksColdCut\public\image\logo.png")
)
$source = $sourceCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $source) { throw "Logo not found at src/assets/logo.png" }

Add-Type -AssemblyName System.Drawing

# Brand blue from the logo ring (background behind the badge on home screen)
$brandBg = [System.Drawing.Color]::FromArgb(255, 27, 75, 138)

function Get-ContentBounds([System.Drawing.Bitmap]$bmp, [int]$threshold = 28) {
    $minX = $bmp.Width; $minY = $bmp.Height; $maxX = 0; $maxY = 0
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $c = $bmp.GetPixel($x, $y)
            if ($c.A -lt 12) { continue }
            $lum = $c.R + $c.G + $c.B
            if ($lum -gt $threshold) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($maxX -lt $minX) { return $null }
    return @{ X = $minX; Y = $minY; W = ($maxX - $minX + 1); H = ($maxY - $minY + 1) }
}

function Get-TrimmedLogo([System.Drawing.Image]$src) {
    $tmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height
    $tg = [System.Drawing.Graphics]::FromImage($tmp)
    $tg.DrawImage($src, 0, 0, $src.Width, $src.Height)
    $tg.Dispose()
    $b = Get-ContentBounds $tmp
    if (-not $b) {
        $tmp.Dispose()
        return $src
    }
    $crop = New-Object System.Drawing.Bitmap $b.W, $b.H
    $cg = [System.Drawing.Graphics]::FromImage($crop)
    $cg.DrawImage($tmp, 0, 0, (New-Object System.Drawing.Rectangle $b.X, $b.Y, $b.W, $b.H),
        [System.Drawing.GraphicsUnit]::Pixel)
    $cg.Dispose()
    $tmp.Dispose()
    return $crop
}

function Draw-LogoOnCanvas([System.Drawing.Image]$logo, [int]$size, [System.Drawing.Color]$background, [bool]$transparentBg) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($transparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear($background)
    }
    # Fill most of the icon so the badge reads at phone size (not a tiny circle in a square)
    $pad = [int][Math]::Max(1, [Math]::Floor($size * 0.04))
    $inner = $size - (2 * $pad)
    $g.DrawImage($logo, $pad, $pad, $inner, $inner)
    $g.Dispose()
    return $bmp
}

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $source))
$logo = Get-TrimmedLogo $srcImg
$srcImg.Dispose()

# In-app asset: trimmed, no huge black square
$appLogoPath = Join-Path $root "src\assets\logo.png"
$appSize = 512
$appBmp = Draw-LogoOnCanvas $logo $appSize $brandBg $false
$appBmp.Save($appLogoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$appBmp.Dispose()
Write-Host "Trimmed logo -> src/assets/logo.png" -ForegroundColor Green

$resDir = Join-Path $root "android\app\src\main\res"

# Legacy square icons (pre-API 26) — full badge on brand blue, not black margins
$legacySizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

# Adaptive foreground (108dp) — transparent; system masks to circle / squircle
$foregroundSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($entry in $legacySizes.GetEnumerator()) {
    $dir = Join-Path $resDir $entry.Key
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $icon = Draw-LogoOnCanvas $logo $entry.Value $brandBg $false
    $icon.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()
    Write-Host "  legacy $($entry.Key) $($entry.Value)px"
}

foreach ($entry in $foregroundSizes.GetEnumerator()) {
    $dir = Join-Path $resDir $entry.Key
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $fg = Draw-LogoOnCanvas $logo $entry.Value ([System.Drawing.Color]::Transparent) $true
    $fg.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()
    Write-Host "  foreground $($entry.Key) $($entry.Value)px"
}

$anydpi = Join-Path $resDir "mipmap-anydpi-v26"
New-Item -ItemType Directory -Force -Path $anydpi | Out-Null
@("ic_launcher.xml", "ic_launcher_round.xml") | ForEach-Object {
    @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@ | Set-Content -Path (Join-Path $anydpi $_) -Encoding UTF8
}

$colorsPath = Join-Path $resDir "values\colors.xml"
$colorsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#F9F5EE</color>
    <color name="ic_launcher_background">#1B4B8A</color>
</resources>
"@
Set-Content -Path $colorsPath -Value $colorsXml -Encoding UTF8

$logo.Dispose()
Write-Host ""
Write-Host "Adaptive icons enabled (round/circle on home screen, full logo)." -ForegroundColor Cyan
Write-Host "Reinstall: npm run android  (or adb uninstall com.ezquerdev first)" -ForegroundColor Green
