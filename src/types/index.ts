export interface MessageAttachment {
  type: 'pdf'
  filename: string
  page_count?: number
  chunk_count?: number
}

export interface Message {
  id: string
  role: 'user' | 'beru'
  content: string
  timestamp: Date
  language?: string
  /** From API when available; otherwise inferred from language/content */
  text_direction?: 'ltr' | 'rtl'
  /** Reveal text progressively (new AI replies only) */
  animate?: boolean
  /** PDF uploaded by the user (shown in chat, not the input bar) */
  attachment?: MessageAttachment
  /** Set when Beru opened a web page for this reply */
  browser_url?: string
}

/** What Beru is doing — drives float overlay + backend browser automation */
export type BeruActivity = 'idle' | 'searching' | 'browsing' | 'reading_page'

export type ClientActionType = 'open_url' | 'focus_app' | 'close_browser'

export interface ClientAction {
  type: ClientActionType
  url?: string
}

export interface ChatResponse {
  response: string
  language: string
  text_direction?: 'ltr' | 'rtl'
  tone?: string
  source?: string
  /** Preferred over `source` for UI + browser session */
  activity?: BeruActivity
  /** URL Beru opened or is reading (show in chat + open in Electron) */
  browser_url?: string
  /** Search query used (display only) */
  search_query?: string
  /** Page title after scrape (display only) */
  page_title?: string
  /** UI runs these in Electron after each response */
  client_actions?: ClientAction[]
  /** Default true — open browser_url in system browser from Electron */
  open_in_browser?: boolean
  user?: string
  is_owner?: boolean
  session_identified?: boolean
  awaiting_voice_wake?: boolean
  voice_verified?: boolean
  voice_enrolled?: boolean
  voice_score?: number
  active_document?: ActiveDocument | null
}

export interface VoiceAuthStatus {
  voice_auth_enabled?: boolean
  voice_enrolled?: boolean
  awaiting_voice_wake?: boolean
  session_identified?: boolean
  is_owner?: boolean
  voice_verified?: boolean
  voice_threshold?: number
  enroll_samples_required?: number
}

export interface VoiceEnrollResponse {
  ok: boolean
  samples?: number
  enrolled?: boolean
  message?: string
}

export interface VoiceAuthState {
  voiceAuthEnabled: boolean
  voiceEnrolled: boolean
  awaitingVoiceWake: boolean
  sessionIdentified: boolean
  isOwner: boolean
  voiceVerified: boolean
}

export interface ActiveDocument {
  id: string
  filename: string
}

export interface DocumentInfo {
  id: string
  filename: string
  page_count: number
  chunk_count: number
  preview: string
  uploaded_at: string
}

export interface UploadResponse {
  status: string
  document: DocumentInfo
  active_document: ActiveDocument
  message: string
}

export interface DocumentsListResponse {
  documents: DocumentInfo[]
  active_document?: ActiveDocument | null
}

export interface ChatRequest {
  message: string
  new_chat?: boolean
  document_id?: string
  session_id?: string
}

export interface VoiceCapabilities {
  stt: boolean
  stt_engine?: string
  whisper_model?: string
  whisper_compute_type?: string
  tts_engine?: string
  tts_server: boolean
  tts_voices?: Record<string, string>
  tts_note?: string
  supported_upload_extensions?: string[]
  recommended_record_format?: string
  sample_rate_hint_hz?: number
}

export interface VoiceTimingMs {
  stt: number
  chat: number
  total: number
}

export interface VoiceChatResponse extends ChatResponse {
  transcript: string
  transcript_language: string
  /** Present when include_audio=1 and server TTS succeeded */
  audio_base64?: string
  audio_mime?: string
  audio_error?: string
  /** Present when API runs with BERU_DEBUG_TIMING=1 */
  timing_ms?: VoiceTimingMs
}
