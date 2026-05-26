# Creates multiple logical commits from current working tree (run from repo root).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Commit-Group {
    param([string]$Message, [string[]]$Paths)
    if ($Paths.Count -eq 0) { return }
    git add -- @Paths
    $status = git diff --cached --quiet 2>$null; $hasStaged = $LASTEXITCODE -ne 0
    if (-not $hasStaged) {
        $st = git status --porcelain -- @Paths 2>$null
        if ($st) { git add -- @Paths }
    }
    git diff --cached --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        git commit -m $Message
        Write-Host "OK  $Message" -ForegroundColor Green
    } else {
        Write-Host "SKIP (empty) $Message" -ForegroundColor DarkGray
    }
}

Write-Host "Creating commits on branch $(git branch --show-current)..." -ForegroundColor Cyan

Commit-Group "feat(api): add Railway API config and customer HTTP client" @(
    "src/config/apiTarget.ts",
    "src/config/apiTarget.local.example.ts",
    "src/app/api/client.ts",
    "src/app/api/customer.ts",
    "src/app/api/mobile.ts",
    "src/utils/apiConfig.ts",
    "src/utils/productOrder.ts",
    "src/utils/deliverySchedule.ts",
    "src/utils/webviewHelpers.ts"
)

Commit-Group "feat(shop): add catalog hooks and cart or favorites context" @(
    "src/hooks/useProductCatalog.ts",
    "src/context/CartContext.tsx",
    "src/context/CartFlyContext.tsx",
    "src/context/FavoritesContext.tsx"
)

Commit-Group "feat(ui): add shop components icons and home category grid" @(
    "src/components/home",
    "src/components/shop",
    "src/components/icons",
    "src/components/AppHeader.tsx",
    "src/components/GuestPrompt.tsx",
    "src/components/ProductGridCard.tsx",
    "src/components/ShopHero.tsx",
    "src/components/ShopSearchBar.tsx"
)

Commit-Group "feat(home): rebuild storefront with products search and categories" @(
    "src/screens/HomeScreen.tsx"
)

Commit-Group "feat(orders): add cart checkout product detail and favorites screens" @(
    "src/screens/CartScreen.tsx",
    "src/screens/CheckoutScreen.tsx",
    "src/screens/ProductDetailScreen.tsx",
    "src/screens/FavoritesScreen.tsx",
    "src/screens/OrderDetailScreen.tsx"
)

Commit-Group "feat(profile): expand profile order history and edit profile" @(
    "src/screens/ProfileScreen.tsx",
    "src/screens/HistoryScreen.tsx",
    "src/screens/EditProfileScreen.tsx",
    "src/screens/AppointmentsScreen.tsx",
    "src/app/api/user.tsx",
    "src/app/reducers/index.tsx"
)

Commit-Group "feat(auth): improve login register and email verification flow" @(
    "src/components/auth",
    "src/screens/auth/Login.tsx",
    "src/screens/auth/Register.tsx",
    "src/screens/auth/VerifyEmailScreen.tsx",
    "src/app/api/auth.tsx",
    "src/app/actions.ts",
    "src/app/reducers/auth.tsx",
    "src/utils/authGate.ts",
    "src/utils/completeEmailVerification.ts",
    "src/utils/emailVerifyDeepLink.ts"
)

Commit-Group "feat(auth): add Google OAuth and deep link handlers" @(
    "src/utils/googleOAuth.ts",
    "src/components/GoogleAuthLinkHandler.tsx",
    "src/components/EmailVerifyLinkHandler.tsx",
    "src/navigations/navigationRef.ts",
    "src/navigations/index.tsx",
    "android/app/src/main/AndroidManifest.xml",
    "ios/Ezquerdev/Info.plist"
)

Commit-Group "feat(nav): update main navigation bottom tabs and app entry" @(
    "src/navigations/MainNav.tsx",
    "src/navigations/AuthNav.tsx",
    "src/components/BottomNav.tsx",
    "src/components/CustomButton.tsx",
    "src/utils/routes.ts",
    "src/utils/theme.ts",
    "src/utils/images.ts",
    "src/utils/index.ts",
    "App.js"
)

Commit-Group "feat(firebase): integrate React Native Firebase on Android" @(
    "package.json",
    "package-lock.json",
    "android/app/google-services.json",
    "android/app/build.gradle",
    "android/build.gradle",
    "android/settings.gradle",
    "src/utils/firebase.tsx",
    "index.js"
)

Commit-Group "feat(android): add Patrick's Cold Cuts launcher icons and logo" @(
    "src/assets/logo.png",
    "android/app/src/main/res/mipmap-mdpi",
    "android/app/src/main/res/mipmap-hdpi",
    "android/app/src/main/res/mipmap-xhdpi",
    "android/app/src/main/res/mipmap-xxhdpi",
    "android/app/src/main/res/mipmap-xxxhdpi",
    "android/app/src/main/res/mipmap-anydpi-v26",
    "android/app/src/main/res/values/colors.xml",
    "scripts/generate-android-icons.ps1"
)

Commit-Group "fix(android): Gradle SSL Hermes release and Metro dev scripts" @(
    "android/gradle.properties",
    "scripts/fix-android-gradle-ssl.ps1",
    "scripts/android-with-metro.ps1",
    "scripts/android-release.ps1",
    "scripts/ensure-emulator.ps1",
    "scripts/connect-app.ps1",
    "scripts/fix-mobile-blank.ps1",
    "scripts/fix-emulator-network.ps1",
    "android/app/src/main/java/com/ezquerdev/MainActivity.kt",
    "android/app/src/main/java/com/ezquerdev/MainApplication.kt",
    "android/app/src/main/res/values/styles.xml"
)

Commit-Group "chore: add dev batch scripts and update project README" @(
    "scripts",
    "README.md",
    ".gitignore",
    "connect-mobile.bat",
    "fix-emulator-network.bat",
    "run-android-dev.bat",
    "run-android.bat",
    "run-web-and-mobile.bat",
    "setup-android-google.bat",
    "start-emulator-cold.bat",
    "start-emulator.bat",
    "tsconfig.json"
)

$left = git status --porcelain
if ($left) {
    Write-Host ""
    Write-Host "Remaining uncommitted files:" -ForegroundColor Yellow
    git status -sb
} else {
    Write-Host ""
    Write-Host "All changes committed." -ForegroundColor Green
}

Write-Host ""
git log --oneline -15
