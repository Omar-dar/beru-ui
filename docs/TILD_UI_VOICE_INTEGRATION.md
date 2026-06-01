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

## Key files

| File | Role |
|------|------|
| `src/services/api.ts` | `voiceChat`, `getVoiceCapabilities`, `speakTextOnServer` |
| `src/utils/speech.ts` | MP3 playback + browser fallback |
| `src/hooks/useChat.ts` | Session, language state, continuous voice |
| `src/components/VoiceSessionOverlay.tsx` | Orb + language picker |