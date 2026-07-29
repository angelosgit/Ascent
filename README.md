# The Ascent

A minimalist focus app. Pick a duration, and Sisyphus climbs for as long as you
stay put. Leave, and the Toll stops the climb until you decide what it was worth.

React Native via Expo, one codebase for iOS and Android.

## Running it

**Expo Go will not work.** The App Store build is pinned to SDK 54 while a SDK 55
submission waits on Apple review; this project is SDK 57. Scanning the QR code
with Expo Go fails with a version mismatch. Use one of the three below instead.

### 1. Browser — fastest, no extra tooling

```bash
npm install
npx expo start --web
```

Opens on <http://localhost:8081>. Narrow the window to a phone shape, or use the
browser's device toolbar (F12 → Ctrl+Shift+M).

Good for the layout, the animation and the HUD. The Toll is only roughly
testable: react-native-web maps `AppState` onto the Page Visibility API, so
switching browser tabs fires `background` and does trigger the modal — but tab
switching is not app switching, and this is the one mechanic that has to be
verified on a real phone before shipping.

### 2. Android emulator

```bash
npx expo start --android
```

Needs Android Studio with an AVD running. Real `AppState` behaviour, so the Toll
can be tested properly.

### 3. Development build on a physical phone — the honest test

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build -p android --profile development
```

Install the resulting APK, then `npx expo start --dev-client`. This is a real
app: correct backgrounding, correct screen-lock, correct force-quit. It is the
only way to be sure the Toll behaves.

The in-app purchase is stubbed in every case — see `src/payments.js`.

### Testing the Toll

Start a climb, then switch to another app. Come back within five seconds and you
get all three choices; come back later and "Continue the Climb" is gone. Force
quitting mid-climb and reopening puts you in the same hard lockout, because the
session is written to storage the moment the app is backgrounded.

## How it works

```
App.js                  phase switch: select -> climb -> toll -> done
src/useSession.js       the session clock and the Toll. The whole state machine.
src/config.js           every tunable the client still owes us an answer on
src/components/Scene.js the climb, animated on the UI thread
src/components/Hud.js   the elevation readout
tools/build_assets.py   regenerates the sprites from SISIFO.psd
```

Two decisions are worth knowing about before reading the code.

**The clock is wall-clock, never a ticking counter.** Elapsed time is always
`Date.now()` arithmetic against a start timestamp. The OS suspends JavaScript the
moment the app is backgrounded, so an interval-based timer would silently
under-count in exactly the situation the app exists to detect.

**Nothing in the climb re-renders.** The parallax, the boulder and the five
rigged body parts are all Reanimated shared values, so the scene runs on the UI
thread and React is uninvolved after the first render. The one exception is the
HUD, which polls the clock ten times a second rather than sixty — the fifth
decimal of a mile takes about twelve seconds to turn over, so there is nothing to
see at frame rate and a lot of battery to lose. That matters here more than in a
normal app: a session runs for an hour with the screen on.

## Sharing a build

Expo Go is not an option: the App Store build is stuck at SDK 54 while a SDK 55
submission waits on Apple, and this project is SDK 57. On iOS that leaves
`eas go` or an ad-hoc build, both of which need a paid Apple Developer
membership. Android has no such problem.

**Android — send them an APK:**

```bash
npx eas-cli login          # free Expo account
npx eas-cli init           # writes the project id into app.json, once
npx eas-cli build -p android --profile preview
```

`eas.json` already has the `preview` profile set to internal distribution and
`buildType: apk`, so this produces a download link you can paste straight into a
chat. They tap it, allow "install from unknown sources", done — no Expo account
and no Expo Go needed on their side.

**iOS:** blocked until the client's Apple Developer account exists. Worth using
as the concrete reason to get it bought.

Record a screen capture as well. Some clients will not install anything, and the
Toll is the part worth seeing.

## Assets

The sprites in `assets/art/` are extracted from `../SISIFO.psd`:

```bash
python tools/build_assets.py      # PSD -> sprites + manifest.json
python tools/optimize_assets.py   # 256-colour quantise: 7.2 MB -> 1.4 MB
```

The artwork is flat-shaded hatching, so the quantise is visually lossless.

## Before this can ship

Read `OPEN-QUESTIONS.md`. The short version: the supplied `mountain` and `bg`
layers carry an Adobe Stock watermark, the background layers are flattened
together and cannot be parallaxed apart, and nothing tiles — so the climb does
not scroll yet. There are also four product decisions outstanding, including the
one that decides whether forfeiting wipes a user's lifetime progress.
