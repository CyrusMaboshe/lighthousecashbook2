@echo off
echo 🚀 Building Lighthouse Cashbook APK...
echo.

REM Check if Flutter is installed
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Flutter SDK not found!
    echo.
    echo Please install Flutter SDK first:
    echo https://docs.flutter.dev/get-started/install/windows
    echo.
    pause
    exit /b 1
)

echo ✅ Flutter SDK found
echo.

echo 📦 Getting dependencies...
flutter pub get
if %errorlevel% neq 0 (
    echo ❌ Failed to get dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building APK (this may take a few minutes)...
flutter build apk --release
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ APK built successfully!
echo.
echo 📱 Your APK is located at:
echo build\app\outputs\flutter-apk\app-release.apk
echo.
echo 🎉 Ready to install on Android devices!
echo.
pause
