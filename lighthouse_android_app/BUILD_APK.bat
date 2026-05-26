@echo off
echo.
echo ========================================
echo 🚀 LIGHTHOUSE CASHBOOK APK BUILDER
echo ========================================
echo.

REM Check if Flutter is installed
echo 🔍 Checking Flutter installation...
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Flutter SDK not found!
    echo.
    echo 📥 Please install Flutter SDK first:
    echo 👉 https://docs.flutter.dev/get-started/install/windows
    echo.
    echo 📋 Quick Install Steps:
    echo 1. Download Flutter SDK
    echo 2. Extract to C:\flutter
    echo 3. Add C:\flutter\bin to PATH
    echo 4. Run 'flutter doctor' to verify
    echo.
    pause
    exit /b 1
)

echo ✅ Flutter SDK found!
echo.

echo 📦 Installing dependencies...
flutter pub get
if %errorlevel% neq 0 (
    echo ❌ Failed to get dependencies
    echo 💡 Try running: flutter clean
    pause
    exit /b 1
)

echo.
echo 🔨 Building APK (this may take 5-10 minutes)...
echo ⏳ Please wait...
echo.
flutter build apk --release
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed!
    echo.
    echo 🛠️ Troubleshooting:
    echo 1. Run: flutter doctor
    echo 2. Run: flutter clean
    echo 3. Check internet connection
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ APK BUILT SUCCESSFULLY!
echo ========================================
echo.
echo 📱 Your APK is located at:
echo 👉 build\app\outputs\flutter-apk\app-release.apk
echo.
echo 📋 Installation Instructions:
echo 1. Copy APK to your Android device
echo 2. Enable "Install from Unknown Sources"
echo 3. Open APK file to install
echo.
echo 🎉 Your Smart Savings app is ready!
echo.
pause
