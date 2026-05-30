import { useState, useCallback, useEffect } from 'react'
import { Message, ActiveDocument, ChatResponse } from '../types'
import {
  sendMessage,
  startChat,
  clearSession,
  uploadDocument,
  getApiErrorMessage,
} from '../services/api'
import { isPdfFile } from '../utils/pdfFile'

const SUGGESTED_PROMPTS = [
  'Summarize this document',
  'What are the main points?',
  'What is this document about?',
]

const makeTildMessage = (
  content: string,
  response?: ChatResponse,
  animate = false
): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role: 'tild',
  content,
  timestamp: new Date(),
  language: response?.language,
  animate,
})

const finalizeAnimating = (prev: Message[]): Message[] =>
  prev.map(m => (m.role === 'tild' && m.animate ? { ...m, animate: false } : m))

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null)
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(false)

  const applySession = useCallback((response: ChatResponse) => {
    setActiveDocument(response.active_document ?? null)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const startRes = await startChat()
        applySession(startRes)
        setMessages([makeTildMessage(startRes.response, startRes)])
      } catch {
        setMessages([makeTildMessage('Hey! I am Tild. Who am I talking to?')])
      }
    }
    init()
  }, [applySession])

  const appendTildReply = useCallback(
    (response: ChatResponse, animate = true) => {
      applySession(response)
      setMessages(prev => [
        ...finalizeAnimating(prev),
        makeTildMessage(response.response, response, animate),
      ])
    },
    [applySession]
  )

  const sendUserMessage = useCallback(
    async (content: string, documentId?: string) => {
      if (!content.trim()) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMessage])
      setLoading(true)
      setError(null)
      setShowSuggestedPrompts(false)

      try {
        const response = await sendMessage(content, {
          document_id: documentId ?? activeDocument?.id,
        })
        appendTildReply(response)
      } catch (err) {
        setError(
          getApiErrorMessage(err, 'Could not connect to Tild. Make sure the server is running!')
        )
      } finally {
        setLoading(false)
      }
    },
    [activeDocument?.id, appendTildReply]
  )

  const rejectInvalidPdf = useCallback(() => {
    setUploadError('Only PDF files are supported.')
  }, [])

  const uploadPdf = useCallback(
    async (file: File) => {
      if (!isPdfFile(file)) {
        rejectInvalidPdf()
        return
      }

      setUploading(true)
      setUploadError(null)
      setError(null)

      try {
        const response = await uploadDocument(file)
        setActiveDocument(response.active_document)
        setShowSuggestedPrompts(true)

        const uploadMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: '',
          timestamp: new Date(),
          attachment: {
            type: 'pdf',
            filename: response.document.filename,
            page_count: response.document.page_count,
            chunk_count: response.document.chunk_count,
          },
        }

        setMessages(prev => [
          ...finalizeAnimating(prev),
          uploadMessage,
          makeTildMessage(response.message, undefined, true),
        ])
      } catch (err) {
        setUploadError(
          getApiErrorMessage(
            err,
            'Upload failed. Use a text-based PDF under 20 MB.'
          )
        )
      } finally {
        setUploading(false)
      }
    },
    [rejectInvalidPdf]
  )

  const clearChat = useCallback(async () => {
    setError(null)
    setUploadError(null)
    setShowSuggestedPrompts(false)

    try {
      const response = await clearSession()
      applySession(response)
      setMessages([makeTildMessage(response.response, response)])
    } catch {
      try {
        const response = await startChat()
        applySession(response)
        setMessages([makeTildMessage(response.response, response)])
      } catch {
        setActiveDocument(null)
        setMessages([makeTildMessage('Hey! I am Tild. Who am I talking to?')])
      }
    }
  }, [applySession])

  return {
    messages,
    loading,
    uploading,
    error,
    uploadError,
    activeDocument,
    showSuggestedPrompts,
    suggestedPrompts: SUGGESTED_PROMPTS,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts: () => setShowSuggestedPrompts(false),
  }
}
