# Boss - Company Management System (Java Android App)

This is a native Java Android application converted from the React Native Boss app.

## Features

- **Dashboard**: Overview of system status and quick actions
- **Attendance**: Employee attendance tracking with grid view
- **Profit/Loss**: Financial overview with income and expense tracking 
- **Bills**: Manage paid and unpaid bills
- **Advance**: Track employee advance payments
- **Live Voice**: AI voice interaction mode

## Tech Stack

- Native Android (Java)
- Material Design 3
- AndroidX Libraries
- RecyclerView for lists
- CardView for UI components
- Gradient backgrounds and animations

## UI/UX

The app has been designed to exactly match the React Native version with pixel-perfect accuracy:
- Same color scheme (#F3F5F9 background, purple/pink gradients)
- Identical card designs with rounded corners
- Matching typography and spacing
- Same navigation flow and bottom navigation bar

## Build Instructions

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 8 or later
- Android SDK API 34
- Gradle 8.0+

### Building the APK

1. Open terminal in the project root directory
2. Run: `./gradlew assembleRelease`
3. The APK will be generated in: `app/build/outputs/apk/release/app-release.apk`

### Installing on Device

```bash
./gradlew installDebug
```

Or use the generated APK:
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## Project Structure

```
BossJava/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/boss/app/
│   │       │   ├── MainActivity.java
│   │       │   ├── DashboardFragment.java
│   │       │   ├── AttendanceFragment.java
│   │       │   ├── ProfitLossFragment.java
│   │       │   ├── BillsFragment.java
│   │       │   ├── AdvanceFragment.java
│   │       │   ├── LiveVoiceFragment.java
│   │       │   ├── NavigationListener.java
│   │       │   ├── Employee.java
│   │       │   ├── Bill.java
│   │       │   ├── AdvanceRecord.java
│   │       │   ├── AttendanceAdapter.java
│   │       │   ├── BillsAdapter.java
│   │       │   └── AdvanceAdapter.java
│   │       ├── res/
│   │       │   ├── layout/
│   │       │   ├── drawable/
│   │       │   ├── values/
│   │       │   └── menu/
│   │       └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Notes

- Minimum SDK: API 24 (Android 7.0)
- Target SDK: API 34 (Android 14)
- The app uses Material Design 3 components for modern UI
- All UI elements are pixel-perfect replicas of the React Native version
