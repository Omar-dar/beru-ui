# Tild UI ↔ Backend (voice + chat)

**API:** `http://localhost:8000` — start with `python3 tild_api.py` from the `tild` repo.

## Voice stack (backend)

- **STT:** faster-whisper (`medium` by default)
- **TTS:** edge-tts neural voices → **MP3** (`audio/mpeg`)

## Mic flow (implemented in tild-ui)

1. `MediaRecorder` → `recording.webm`
2. `POST /voice/chat` multipart: `audio`, optional `document_id` (Whisper auto-detects language)
3. Show `transcript` (user) + `response` (Tild, markdown)
4. `POST /voice/speak` JSON `{ text, language }` — `language` from API response
5. **422** → “Could not understand audio, try again”
6. States: listening → thinking → speaking → listening (until goodbye or ✕)

## Arabic / RTL (`text_direction`)

| Backend (`src/text_direction.py`) | tild-ui |
|-----------------------------------|---------|
| Bidi isolates + LTR isolation for Latin in Arabic replies | Renders API `response` as-is |
| `"text_direction": "rtl"` when `language` is `"ar"` on `/chat`, `/start`, `/clear`, `/voice/chat` | `dir="rtl"` on bubbles when `message.text_direction === "rtl"` |
| Gate uses تيلد / عمر | Display only — no UI change |

`src/utils/textDirection.ts` — prefers API `text_direction`, then `language === "ar"`, then Arabic script in text.

## Key files

| File | Role |
|------|------|
| `src/services/api.ts` | `voiceChat`, `getVoiceCapabilities`, `speakTextOnServer` |
| `src/utils/speech.ts` | MP3 playback + browser fallback |
| `src/utils/textDirection.ts` | `text_direction` + `dir` for messages |
| `src/hooks/useChat.ts` | Stores `text_direction` from API on Tild messages |
| `src/components/MessageBubble.tsx` | Applies `dir` / RTL CSS |
| `src/components/VoiceSessionOverlay.tsx` | Voice orb UI |