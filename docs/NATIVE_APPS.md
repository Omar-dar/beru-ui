# Beru — PWA, Desktop (Electron), and Mobile (Capacitor)

One React codebase runs in four ways:

| Platform | How | Install / run |
|----------|-----|----------------|
| **Browser** | `npm start` | http://localhost:3000 |
| **PWA** | Install from browser | Phone: Add to Home Screen · Desktop: Install in Chrome/Edge |
| **Desktop app** | Electron | `npm run electron:dev` · `npm run electron:build` |
| **Phone app** | Capacitor | `npm run cap:android` · `npm run cap:ios` (Mac + Xcode) |

---

## API URL (required for all builds)

The backend URL is baked in at **build time** via `REACT_APP_API_URL`.

```bash
# Local backend
REACT_APP_API_URL=http://localhost:8000 npm run build:web

# Phone on same Wi‑Fi (use your PC’s LAN IP)
REACT_APP_API_URL=http://192.168.1.10:8000 npm run build:web

# Production / phone over internet (HTTPS)
REACT_APP_API_URL=https://your-tunnel.ngrok-free.app npm run build:web
```

Then sync native apps: `npm run cap:sync`

---

## PWA (Progressive Web App)

After `npm run build:web`, deploy the `build/` folder (Netlify, etc.) or serve locally.

**Install on phone**
- **iPhone:** Safari → Share → **Add to Home Screen**
- **Android:** Chrome → menu → **Install app** / **Add to Home screen**

**Install on desktop**
- Chrome or Edge → address bar **Install** icon

The app opens full-screen (no browser UI). A service worker caches the UI shell for faster loads.

---

## Electron (Windows, Mac, Linux)

### Development (hot reload)
```bash
npm run electron:dev
```
Opens a desktop window pointed at `http://localhost:3000`. Start your Beru backend separately.

### Production installer
```bash
npm run electron:build
```
Output: `dist-electron/` (`.exe` on Windows, `.dmg` on Mac, `.AppImage` on Linux).

**Note:** Building Mac `.dmg` from Windows is not supported — use a Mac or CI.

Microphone permission is auto-allowed for voice chat in the Electron shell.

### Always-on-top voice widget (desktop)

During a **voice session** (listening, thinking, speaking) or while **searching the web**, the voice companion (top-right orb) lives in a **separate always-on-top window**. It stays visible even if:

- Chrome/Safari opens for a web search
- You switch to another app
- The main Beru window is behind other windows

While you are **listening** (speak now), the large center orb stays in the main window. Close the float widget with ✕ — same as ending voice from the main app.

---

## Capacitor (iOS + Android)

### First-time setup
```bash
npm install
npm run cap:add:android    # Android Studio project
npm run cap:add:ios        # Xcode project (Mac only)
```

### Every UI change
```bash
npm run cap:sync           # build web + copy to native projects
```

### Open in IDE
```bash
npm run cap:android        # Android Studio
npm run cap:ios            # Xcode (Mac only)
```

Run on device/emulator from Android Studio or Xcode.

### Microphone (voice chat)

**Android** — `android/app/src/main/AndroidManifest.xml` should include:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

**iOS** — `ios/App/App/Info.plist` should include:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Beru uses the microphone for voice chat.</string>
```

Capacitor may add these when you first run on device; add them if voice fails.

### App Store / Play Store

1. Set `REACT_APP_API_URL` to your production HTTPS API
2. `npm run cap:sync`
3. Bump version in native projects
4. Archive in Xcode (iOS) or Generate Signed Bundle (Android)

Change bundle ID in `capacitor.config.ts` (`appId`) before publishing.

---

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run build:web` | React build + PWA service worker |
| `npm run electron:dev` | Desktop app (dev) |
| `npm run electron:build` | Desktop installer |
| `npm run cap:sync` | Build + sync to Android/iOS |
| `npm run cap:android` | Sync + open Android Studio |
| `npm run cap:ios` | Sync + open Xcode |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| White screen in Electron | Ensure `homepage` is `./` in `package.json` and run `npm run build:web` before packaging |
| API unreachable on phone | Use LAN IP or HTTPS tunnel, not `localhost` |
| Voice not working on mobile | Check mic permissions in manifest / Info.plist |
| PWA not installing | Must be served over HTTPS (or localhost) |
