# Beru UI ↔ Backend — Browser & Web Search

Copy this to your **backend agent**. The wrong answers (WhatsApp text, random Swedish dictionary) happen when the backend **guesses** instead of **reading the real page**.

---

## The problem (what you saw)

| User asked | Bad backend behavior |
|------------|----------------------|
| Weather in Stockholm | Opened Google but **made up** forecast OR read wrong page |
| Time in Stockholm | Returned **WhatsApp** page text |
| Gothenburg weather | Returned **Swedish dictionary** for "okay" |

**Root cause:** Backend opens a browser but does **not** scrape the correct page, then **hallucinates** `response` text.

**Fix:** Use Playwright/Puppeteer (or similar) on the server to:
1. Open the search URL
2. Wait for results
3. Extract **visible text** from the results page
4. Put **only that text** in `response` (and optional `page_excerpt` field)
5. Never invent content

---

## UI behavior (beru-ui — already implemented)

### Float overlay (Electron desktop only)

The top-right voice widget stays visible when:

- `activity` is `searching`, `browsing`, or `reading_page`
- OR `source` is `search` / `web_search`
- OR `browser_url` is set
- OR `client_actions` includes `open_url`

It stays on top even when Chrome opens for search.

**Ends when:**

- `activity: "idle"`
- OR `client_actions` includes `focus_app` or `close_browser`
- OR user clicks **Back to Beru** / ✕ on float widget

### Client actions (Electron runs these in order)

| Action | UI does |
|--------|---------|
| `open_url` | Open URL in **your system browser** (Chrome, Edge, etc.) |
| `close_tab` | Clears Beru browser session state (tab stays in your browser) |
| `scroll` / `scroll_to_text` | Skipped in UI — backend scrapes via Playwright headless |
| `focus_app` / `close_browser` | Focus Beru window, hide float widget |

**UI only runs `client_actions` from the API** — never builds Google search URLs locally.

Display `opened_url` / `browser_url` as **Opened: …** chip in chat (not in TTS).

### Header button

When browser session is active, **Back to Beru** appears in the app header.

---

## API contract — add to every `/chat` and `/voice/chat` response

```json
{
  "response": "Based on what I read on the page: …",
  "language": "en",
  "activity": "reading_page",
  "source": "search",
  "search_query": "weather Stockholm today",
  "browser_url": "https://www.google.com/search?q=weather+stockholm",
  "page_title": "weather stockholm - Google Search",
  "open_in_browser": true,
  "client_actions": [
    { "type": "open_url", "url": "https://www.google.com/search?q=weather+stockholm" }
  ]
}
```

### Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `response` | string | Yes | What Beru says — **must come from scraped content** |
| `activity` | string | Recommended | `idle` \| `searching` \| `browsing` \| `reading_page` |
| `source` | string | Optional | `search` or `web_search` (legacy, still works) |
| `search_query` | string | Optional | Shown in float widget |
| `browser_url` | string | Optional | URL opened; shown in chat + opened in browser |
| `page_title` | string | Optional | Shown in float widget when reading |
| `open_in_browser` | boolean | Optional | Default `true` — UI opens `browser_url` |
| `client_actions` | array | Optional | `open_url`, `focus_app`, `close_browser` |

### Activity flow

```
User: "Search Google for weather in Stockholm"
  → activity: "searching"
  → client_actions: [{ type: "open_url", url: "..." }]
  → browser_url: "..."

Backend finishes scrape
  → activity: "reading_page"
  → response: only facts from page text

User: "What can you see?" / follow-up
  → activity: "reading_page"
  → response: from same or new scrape — NOT from memory/hallucination

User: "Thanks" / "Go back" / task done
  → activity: "idle"
  → client_actions: [{ type: "focus_app" }]
```

---

## Backend implementation checklist

1. **Detect search intent** (weather, time, news, "search for", "open google", etc.)
2. **Build search URL** (Google, DuckDuckGo, etc.)
3. **Playwright**: `page.goto(url)` → `page.innerText('body')` or targeted selectors
4. **Parse** weather/time from extracted text (or use a weather API instead of scraping Google)
5. **Return** structured response with `activity`, `browser_url`, `client_actions`
6. **Follow-up "what do you see"**: re-scrape active tab or stored page content — **never guess**
7. **When done**: `activity: "idle"` + `focus_app`

### Example Python pseudocode

```python
async def handle_search(query: str) -> dict:
    url = f"https://www.google.com/search?q={quote(query)}"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        text = await page.inner_text("body")  # or #search, .wob_df, etc.
        await browser.close()

    summary = summarize_with_llm(text, query)  # LLM only sees scraped text

    return {
        "response": summary,
        "language": "en",
        "activity": "reading_page",
        "source": "search",
        "search_query": query,
        "browser_url": url,
        "page_title": query,
        "client_actions": [{"type": "open_url", "url": url}],
    }

def handle_done():
    return {
        "response": "Back in the app. What else?",
        "language": "en",
        "activity": "idle",
        "client_actions": [{"type": "focus_app"}],
    }
```

---

## What NOT to do

- Do **not** put WhatsApp/dictionary/random text in `response` without scraping
- Do **not** say "I opened Google, check the tab" without reading the tab when user asks "what do you see"
- Do **not** leave `activity` on `searching` forever — update to `reading_page` then `idle`
- Do **not** rely on `source: "search"` alone — set `activity` and real `browser_url`

---

## Files changed in beru-ui

| File | Role |
|------|------|
| `src/types/index.ts` | `activity`, `browser_url`, `client_actions` |
| `src/utils/browserSession.ts` | Detect browser session start/end |
| `src/native/electronBrowser.ts` | Run `open_url` / `focus_app` |
| `src/hooks/useChat.ts` | Browser session state, apply response actions |
| `src/hooks/useElectronVoiceOverlay.ts` | Float visible during browser session |
| `electron/browserManager.js` | System browser via `openExternal` + `client_actions` |
| `electron/main.js` | `beru:client-actions`, `beru:browser-state` IPC |
| `src/App.tsx` | "Back to Beru" button |
| `src/components/FloatingVoiceWidget.tsx` | URL + hint in float widget |

---

## Test plan

1. `npm run electron:dev` + backend running
2. Text chat: "Search weather in Stockholm" → float widget appears, browser opens, widget stays on top
3. "What can you see?" → backend must return scraped weather, not WhatsApp
4. Say done / backend sends `focus_app` → Beru window focused, float hides
5. Voice chat during search → same float behavior
