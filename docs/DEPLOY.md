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
| Build command | `npm run build` (see `netlify.toml`) |
| Publish directory | `build` |
| Environment variable | `REACT_APP_API_URL` = backend URL |

### Verify the env var actually shipped

After deploy, this must **not** show `localhost`:

```bash
curl -sL https://tildui.netlify.app/static/js/main.*.js 2>/dev/null | head -1
# Or open site, View Source, copy main.*.js name, then:
curl -sL "https://tildui.netlify.app/static/js/main.XXXX.js" | grep -o 'http[s]*://[^"]*8000' | head -3
```

If you still see `localhost:8000`, Netlify did not pass `REACT_APP_API_URL` at build time.

**Common mistakes**

1. Variable name typo — must be exactly `REACT_APP_API_URL`
2. **Scopes** — enable **Production** (and **Builds** if shown)
3. Wrong site — variable must be on **tildui.netlify.app**, not another Netlify site
4. **Secret / sensitive** — do **not** mark `REACT_APP_API_URL` as a secret withheld from the build. It is public in the JS bundle anyway (normal for `REACT_APP_*`).
5. Redeploy without **Clear cache and deploy site**

**If the env panel still does not reach the build**, temporarily set Build command to:

```bash
REACT_APP_API_URL=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app npm run build
```

(CRA only reads env at build time.) Clear cache and deploy. The new deploy log should show a **new** `main.XXXXXXXX.js` hash (not the old one). Check:

```bash
curl -sL "https://tildui.netlify.app/" | grep -o 'static/js/main[^"]*'
```

If the hash changes, the UI was fine — fix the Netlify env UI, then switch the build command back to `npm run build`.

Examples for `REACT_APP_API_URL`:

- **Phone + Netlify (required):** `https://your-subdomain.ngrok-free.app` — HTTPS only; `http://192.168.x.x` is blocked by Safari mixed content on https://tildui.netlify.app
- LAN `http://192.168.x.x:8000` only works if you open the UI over HTTP too (not the Netlify HTTPS URL)

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
