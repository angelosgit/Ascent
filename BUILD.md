# Building the APK

This archive is source only. `node_modules/` and `android/` are both excluded
because both are generated — the steps below recreate them.

## What the machine needs

| | |
| --- | --- |
| Node.js | 20 or newer (built on 24.16.0) |
| JDK | 17 — Temurin or Microsoft OpenJDK. **Not** 21, the Gradle plugin rejects it |
| Android SDK | platform `android-36`, build-tools `36.0.0`, and the NDK |
| `JAVA_HOME` | pointing at the JDK |
| `ANDROID_HOME` | pointing at the SDK |

Installing Android Studio and opening SDK Manager once is the easiest way to get
the SDK, platform and NDK together.

## Build

```bash
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease          # gradlew.bat on Windows
```

The APK lands at:

```
android/app/build/outputs/apk/release/app-release.apk
```

It is signed with the debug keystore that `prebuild` generates, which is exactly
what you want for a test build — it installs on any phone without Play Store
signing. It is *not* suitable for a store upload; that needs a real upload key.

Send that file to the client. They tap it and allow "install from unknown
sources".

## If the JVM crashes on startup

Symptom:

```
EXCEPTION_ILLEGAL_INSTRUCTION (0xc000001d)
Problematic frame: C  [ASProxy64.dll+0xc274]
```

That is **Astrill VPN**, not the project. Its proxy DLL injects itself into
processes and kills every Gradle daemon as it forks. Quit Astrill from the system
tray and build again, or add the JDK's `java.exe` to Astrill's per-app exclusion
list. Other VPNs and endpoint-security agents that hook processes can do the same
thing.

## Running it without building

Expo Go cannot open this project — the store build is pinned to SDK 54 and this
is SDK 57. To see it without a full native build:

```bash
npm install
npx expo start --web
```

See README.md for what the browser can and cannot tell you — the Toll in
particular needs a real device.

## Regenerating the artwork

`assets/art/` is committed, so a build does not need the PSD. Only rerun these if
the client sends new artwork, and note they expect `SISIFO (1).psd` one directory
above the project:

```bash
pip install psd-tools pillow
python tools/build_assets.py       # PSD -> sprites + manifest.json
python tools/optimize_assets.py    # quantise: 7.2 MB -> 1.4 MB
python tools/build_icons.py        # app icon + splash from the boulder
```
