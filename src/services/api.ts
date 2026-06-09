import axios from 'axios'
import { getBeruSessionId } from '../utils/beruSession'
import { extensionForAudioBlob } from '../utils/voiceSupport'
import {
  ChatRequest,
  ChatResponse,
  DocumentsListResponse,
  UploadResponse,
  VoiceCapabilities,
  VoiceChatResponse,
  VoiceAuthStatus,
  VoiceEnrollResponse,
} from '../types'

export const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

axios.defaults.headers.common['X-Beru-Session-Id'] = getBeruSessionId()

type ApiErrorBody = {
  error?: string
  message?: string
  detail?: string | { msg: string }[]
}

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) {
    return fallback
  }

  if (!err.response) {
    if (err.code === 'ERR_NETWORK') {
      if (
        API_URL.includes('localhost') ||
        API_URL.includes('127.0.0.1')
      ) {
        return (
          'Cannot reach Beru: this build uses localhost, which only works on the Mac running the API. ' +
          'On Netlify, set REACT_APP_API_URL to your Mac’s LAN IP or an HTTPS tunnel URL, redeploy, ' +
          'and run python3 beru_api.py on the Mac.'
        )
      }
      return `Cannot reach Beru at ${API_URL}. Start the backend with: python3 beru_api.py`
    }
    return err.message || fallback
  }

  const data = err.response.data as ApiErrorBody | string
  if (!data) {
    return `${fallback} (HTTP ${err.response.status})`
  }
  if (typeof data === 'string') {
    return data
  }
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }
  if (typeof data.detail === 'string') {
    return data.detail
  }
  if (Array.isArray(data.detail)) {
    return data.detail.map(d => d.msg).join(', ')
  }
  return `${fallback} (HTTP ${err.response.status})`
}

/** 422 from /voice/chat — empty or unclear transcription */
export const getVoiceChatErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err) && err.response?.status === 422) {
    return 'Could not understand audio, try again'
  }
  return getApiErrorMessage(err, 'Voice message failed. Check the API and try again.')
}

export const sendMessage = async (
  message: string,
  options?: { new_chat?: boolean; document_id?: string }
): Promise<ChatResponse> => {
  const body: ChatRequest = {
    message,
    ...options,
    session_id: getBeruSessionId(),
  }
  const response = await axios.post<ChatResponse>(`${API_URL}/chat`, body)
  return response.data
}

export const startChat = async (): Promise<ChatResponse> => {
  const response = await axios.get<ChatResponse>(`${API_URL}/start`)
  return response.data
}

export const clearSession = async (): Promise<ChatResponse> => {
  const response = await axios.post<ChatResponse>(`${API_URL}/clear`)
  return response.data
}

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post<UploadResponse>(`${API_URL}/upload`, formData)
  return response.data
}

export const listDocuments = async (): Promise<DocumentsListResponse> => {
  const response = await axios.get<DocumentsListResponse>(`${API_URL}/documents`)
  return response.data
}

export const getVoiceCapabilities = async (): Promise<VoiceCapabilities> => {
  const response = await axios.get<VoiceCapabilities>(`${API_URL}/voice/capabilities`)
  return response.data
}

export const getVoiceAuthStatus = async (): Promise<VoiceAuthStatus | null> => {
  try {
    const response = await axios.get<VoiceAuthStatus>(`${API_URL}/voice/auth/status`)
    return response.data
  } catch {
    return null
  }
}

export const enrollVoice = async (clips: Blob[]): Promise<VoiceEnrollResponse> => {
  const formData = new FormData()
  for (const clip of clips) {
    const ext = extensionForAudioBlob(clip)
    formData.append('audio', clip, `enroll.${ext}`)
  }
  const response = await axios.post<VoiceEnrollResponse>(`${API_URL}/voice/enroll`, formData)
  return response.data
}

export const voiceChat = async (
  audio: Blob,
  options?: {
    new_chat?: boolean
    document_id?: string
    /** Request TTS audio in the same response (skips /voice/speak round trip) */
    include_audio?: boolean
  }
): Promise<VoiceChatResponse> => {
  const formData = new FormData()
  const ext = extensionForAudioBlob(audio)
  formData.append('audio', audio, `recording.${ext}`)
  if (options?.document_id) {
    formData.append('document_id', options.document_id)
  }
  if (options?.new_chat) {
    formData.append('new_chat', 'true')
  }
  if (options?.include_audio) {
    formData.append('include_audio', 'true')
  }
  formData.append('session_id', getBeruSessionId())
  const response = await axios.post<VoiceChatResponse>(`${API_URL}/voice/chat`, formData)
  return response.data
}

export const speakTextOnServer = async (
  text: string,
  language: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> => {
  const response = await axios.post(
    `${API_URL}/voice/speak`,
    { text, language },
    { responseType: 'arraybuffer' }
  )
  const rawMime = response.headers['content-type']
  const mimeType =
    typeof rawMime === 'string' ? rawMime.split(';')[0].trim() : 'audio/mpeg'
  return { buffer: response.data, mimeType }
}
