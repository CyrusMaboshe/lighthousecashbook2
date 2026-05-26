# 📱 Smart Savings - Android App

Convert your Smart Savings website into a native Android APK that can be installed on any Android device.

## 🎯 **WHAT THIS DOES**

Transforms your web application into a native Android app using Flutter WebView:
- ✅ **Full website functionality** in native app wrapper
- ✅ **No layout changes** - exact same UI as website
- ✅ **Offline-capable** with proper caching
- ✅ **Native Android experience** with proper navigation
- ✅ **Easy installation** - no Play Store required

## 🚀 **QUICK START**

### **Method 1: Automated Build (Windows)**
```bash
# Double-click this file:
build_apk.bat
```

### **Method 2: Manual Build**
```bash
# 1. Install Flutter SDK (if not installed)
# Download: https://docs.flutter.dev/get-started/install

# 2. Navigate to project
cd flutter_webview_app

# 3. Get dependencies
flutter pub get

# 4. Build APK
flutter build apk --release

# 5. Find APK at:
# build/app/outputs/flutter-apk/app-release.apk
```

## 📱 **APP DETAILS**

- **App Name:** Lighthouse Cashbook
- **Package ID:** com.lighthouse.cashbook
- **Min Android:** 4.4 (API 19)
- **Target Android:** 13 (API 33)
- **Size:** ~15-20MB
- **Website URL:** https://cyrusmaboshe.github.io/lighthouse-cash-flow-keeper/

## 🔧 **CUSTOMIZATION**

### **Change Website URL:**
Edit `lib/main.dart` line 8:
```dart
final String site = 'https://your-website-url.com';
```

### **Change App Name:**
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
android:label="Your App Name"
```

### **Change Package Name:**
1. Edit `android/app/build.gradle`:
   ```gradle
   applicationId "com.yourcompany.yourapp"
   ```
2. Rename folder structure in `android/app/src/main/kotlin/`

## 📦 **INSTALLATION**

Once APK is built:

### **Via USB Cable:**
1. Enable "Developer Options" on Android device
2. Enable "USB Debugging"
3. Copy APK to device
4. Install using file manager

### **Via WhatsApp/Email:**
1. Send APK file via WhatsApp or email
2. Download on Android device
3. Enable "Install from Unknown Sources"
4. Install APK

### **Via ADB (Advanced):**
```bash
adb install app-release.apk
```

## 🛠️ **REQUIREMENTS**

### **For Building:**
- Flutter SDK 3.0+
- Android SDK 30+
- Java 8+
- 4GB+ RAM
- 10GB+ free space

### **For Running:**
- Android 4.4+ device
- Internet connection
- 50MB+ free space

## 🔍 **TROUBLESHOOTING**

### **Build Issues:**
```bash
# Check Flutter setup
flutter doctor

# Clean and rebuild
flutter clean
flutter pub get
flutter build apk --release
```

### **Installation Issues:**
- Enable "Unknown Sources" in Android settings
- Check available storage space
- Ensure Android version compatibility

### **Runtime Issues:**
- Check internet connection
- Verify website URL is accessible
- Clear app data if needed

## 📋 **PROJECT STRUCTURE**

```
flutter_webview_app/
├── lib/
│   └── main.dart              # Main app code
├── android/
│   ├── app/
│   │   ├── build.gradle       # Android build config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # App permissions
│   │       └── kotlin/        # Android native code
├── pubspec.yaml               # Flutter dependencies
├── build_apk.bat             # Automated build script
└── README.md                 # This file
```

## 🎉 **SUCCESS!**

After building, you'll have:
- **APK File:** `build/app/outputs/flutter-apk/app-release.apk`
- **Size:** ~15-20MB
- **Ready to install** on any Android device
- **No Play Store required**

Your Smart Savings is now a native Android app! 📱✨
