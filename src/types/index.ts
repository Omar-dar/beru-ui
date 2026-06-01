export interface MessageAttachment {
  type: 'pdf'
  filename: string
  page_count?: number
  chunk_count?: number
}

export interface Message {
  id: string
  role: 'user' | 'tild'
  content: string
  timestamp: Date
  language?: string
  /** From API when available; otherwise inferred from language/content */
  text_direction?: 'ltr' | 'rtl'
  /** Reveal text progressively (new AI replies only) */
  animate?: boolean
  /** PDF uploaded by the user (shown in chat, not the input bar) */
  attachment?: MessageAttachment
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

export interface ChatResponse {
  response: string
  language: string
  text_direction?: 'ltr' | 'rtl'
  tone?: string
  source?: string
  user?: string
  is_owner?: boolean
  session_identified?: boolean
  active_document?: ActiveDocument | null
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

export interface VoiceChatResponse extends ChatResponse {
  transcript: string
  transcript_language: string
}
