import axios, { AxiosError } from 'axios'
import {
  ChatRequest,
  ChatResponse,
  DocumentsListResponse,
  UploadResponse,
} from '../types'

const API_URL = 'http://localhost:8000'

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
      return `Cannot reach Tild at ${API_URL}. Start the backend with: python3 tild.py api`
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

export const sendMessage = async (
  message: string,
  options?: { new_chat?: boolean; document_id?: string }
): Promise<ChatResponse> => {
  const body: ChatRequest = { message, ...options }
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
  // Let axios set Content-Type with the correct multipart boundary
  const response = await axios.post<UploadResponse>(`${API_URL}/upload`, formData)
  return response.data
}

export const listDocuments = async (): Promise<DocumentsListResponse> => {
  const response = await axios.get<DocumentsListResponse>(`${API_URL}/documents`)
  return response.data
}
