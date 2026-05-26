# 📱 Smart Savings - Android App

Convert your Smart Savings website into a native Android APK.

## 🚀 **QUICK START**

### **🎯 Super Easy Method:**
1. **Double-click:** `BUILD_APK.bat`
2. **Wait:** 5-10 minutes for build
3. **Get APK:** `build/app/outputs/flutter-apk/app-release.apk`

### **📋 Manual Method:**
```bash
flutter pub get
flutter build apk --release
```

## 📱 **APP DETAILS**

- **📱 Name:** Smart Savings
- **🆔 Package:** com.smartsavings.cashbook
- **🌐 Website:** https://cyrusmaboshe.github.io/lighthouse-cash-flow-keeper/
- **📏 Size:** ~15-20MB
- **🤖 Android:** 4.4+ (API 19+)

## 🔧 **CUSTOMIZATION**

### **Change Website URL:**
Edit `lib/main.dart` line 9:
```dart
final String site = 'https://your-website-url.com';
```

### **Change App Name:**
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
android:label="Your App Name"
```

## 📦 **INSTALLATION**

### **🔌 USB Cable:**
1. Copy APK to phone
2. Enable "Unknown Sources" in Settings
3. Install via file manager

### **💬 WhatsApp/Email:**
1. Send APK file
2. Download on phone
3. Install directly

## 🛠️ **REQUIREMENTS**

### **For Building:**
- Flutter SDK 3.0+
- Android SDK
- 4GB+ RAM
- Internet connection

### **For Installing:**
- Android 4.4+ device
- 50MB+ free space

## 🔍 **TROUBLESHOOTING**

### **Build Issues:**
```bash
flutter doctor          # Check setup
flutter clean           # Clean project
flutter pub get         # Get dependencies
flutter build apk --release
```

### **Installation Issues:**
- Enable "Unknown Sources" in Android settings
- Check available storage space
- Ensure Android version compatibility

## 🎉 **SUCCESS!**

After building, you'll have a native Android app that:
- ✅ Loads your website in full-screen
- ✅ Works offline (with caching)
- ✅ Installs without Play Store
- ✅ Looks and feels native

**Your Lighthouse Cash Flow Keeper is now a mobile app!** 📱✨
