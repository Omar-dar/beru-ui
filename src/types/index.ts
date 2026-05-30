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
