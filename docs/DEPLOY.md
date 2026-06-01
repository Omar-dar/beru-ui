# Deploying tild-ui (Netlify + phone)

## Local development (Mac)

```bash
cd tild-ui
npm start
```

Uses `.env.development` → `REACT_APP_API_URL=http://localhost:8000`

Start the backend on your Mac:

```bash
cd tild
python3 tild_api.py
```

## Environment variable

| Where | `REACT_APP_API_URL` |
|-------|---------------------|
| `npm start` (dev) | `http://localhost:8000` via `.env.development` |
| Netlify | Your Mac LAN IP or ngrok HTTPS URL (not `localhost`) |
| Local prod test | `REACT_APP_API_URL=http://localhost:8000 npm run build` |

CRA bakes this in at **build time**. Redeploy Netlify after changing the variable.

## Netlify

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Publish directory | `build` |
| Environment variable | `REACT_APP_API_URL` = backend URL |

Examples for `REACT_APP_API_URL`:

- Same Wi‑Fi: `http://192.168.x.x:8000` (Mac IP from System Settings → Network)
- Phone + HTTPS: `https://your-subdomain.ngrok-free.app` (tunnel to port 8000)

## Microphone on phone

The mic **only works on HTTPS** (Netlify URL is fine). These **do not** work for voice:

- `http://192.168.x.x:8000` or `http://` on your phone
- `http://localhost` from another device

When you tap the mic, **allow microphone** when Safari/Chrome asks.

Use **Safari or Chrome** on iOS (not an in-app browser like Instagram).

## Backend on Mac (required for phone / Netlify)

1. API must listen on the network, e.g. `app.run(host='0.0.0.0', port=8000, debug=False)` in `tild_api.py`
2. Allow port **8000** in macOS Firewall if prompted
3. Phone and Mac on same Wi‑Fi (LAN IP), or use ngrok for HTTPS

## Test production build locally

```bash
REACT_APP_API_URL=http://localhost:8000 npm run build
npx serve -s build
```

Open the URL `serve` prints; it should still reach Tild on your Mac.
