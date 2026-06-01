import { useState, useCallback, useEffect, useRef } from 'react'
import { Message, ActiveDocument, ChatResponse, VoiceCapabilities } from '../types'
import {
  sendMessage,
  startChat,
  clearSession,
  uploadDocument,
  voiceChat,
  getVoiceCapabilities,
  getApiErrorMessage,
  getVoiceChatErrorMessage,
} from '../services/api'
import { isPdfFile } from '../utils/pdfFile'
import { speakTildReply, stopSpeaking } from '../utils/speech'
import { isGoodbyeMessage } from '../utils/voiceGoodbye'
import { getMessageDirection } from '../utils/textDirection'
import { useVoiceRecorder } from './useVoiceRecorder'
import { VoiceOrbMode } from '../components/VoiceOrb'

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
  text_direction: response?.text_direction,
  animate,
})

const finalizeAnimating = (prev: Message[]): Message[] =>
  prev.map(m => (m.role === 'tild' && m.animate ? { ...m, animate: false } : m))

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null)
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(false)
  const [voiceCapabilities, setVoiceCapabilities] = useState<VoiceCapabilities | null>(null)

  const [voiceSessionOpen, setVoiceSessionOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState<VoiceOrbMode>('listening')
  const voiceSessionOpenRef = useRef(false)
  const sendVoiceMessageRef = useRef<(audio: Blob) => Promise<void>>(async () => {})

  const recorder = useVoiceRecorder()
  const voiceSttAvailable =
    voiceCapabilities === null || voiceCapabilities.stt !== false
  const voiceDisabledHint =
    !recorder.isSupported
      ? recorder.supportReason
      : !voiceSttAvailable
        ? 'Voice input is not enabled on the server.'
        : null

  const applySession = useCallback((response: ChatResponse) => {
    setActiveDocument(response.active_document ?? null)
  }, [])

  useEffect(() => {
    voiceSessionOpenRef.current = voiceSessionOpen
  }, [voiceSessionOpen])

  const closeVoiceSession = useCallback(() => {
    stopSpeaking()
    recorder.cancelRecording()
    voiceSessionOpenRef.current = false
    setVoiceSessionOpen(false)
    setVoiceProcessing(false)
    setVoiceError(null)
    setVoiceMode('listening')
  }, [recorder])

  const resumeListening = useCallback(async () => {
    if (!voiceSessionOpenRef.current) return

    setVoiceError(null)
    setVoiceMode('listening')
    setVoiceProcessing(false)

    const result = await recorder.startRecording(blob => {
      void sendVoiceMessageRef.current(blob)
    })
    if (!result.ok) {
      setVoiceError(result.error)
    }
  }, [recorder])

  useEffect(() => {
    const init = async () => {
      try {
        const [startRes, voiceCaps] = await Promise.all([
          startChat(),
          getVoiceCapabilities().catch(() => null),
        ])
        if (voiceCaps) {
          setVoiceCapabilities(voiceCaps)
        }
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

      stopSpeaking()

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
        setMessages(prev =>
          prev.map(m =>
            m.id === userMessage.id
              ? {
                  ...m,
                  text_direction: getMessageDirection(content, response.language),
                }
              : m
          )
        )
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

  const sendVoiceMessage = useCallback(
    async (audio: Blob) => {
      if (!voiceSessionOpenRef.current) return

      if (!audio.size) {
        setVoiceError('No audio captured. Try again.')
        await resumeListening()
        return
      }

      stopSpeaking()
      setVoiceProcessing(true)
      setVoiceMode('processing')
      setVoiceError(null)
      setError(null)
      setShowSuggestedPrompts(false)

      try {
        const response = await voiceChat(audio, {
          document_id: activeDocument?.id,
        })

        const transcript = response.transcript?.trim()
        if (!transcript) {
          setVoiceError('Could not understand audio, try again')
          await resumeListening()
          return
        }

        const endingSession = isGoodbyeMessage(transcript)

        const userLang = response.transcript_language || response.language
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: transcript,
          timestamp: new Date(),
          language: userLang,
          text_direction: getMessageDirection(transcript, userLang),
        }

        applySession(response)
        setMessages(prev => [
          ...finalizeAnimating(prev),
          userMessage,
          makeTildMessage(response.response, response, true),
        ])

        setVoiceMode('speaking')
        await speakTildReply(
          response.response,
          response.language || response.transcript_language || 'en',
          voiceCapabilities?.tts_server !== false
        )

        if (endingSession) {
          closeVoiceSession()
          return
        }

        await resumeListening()
      } catch (err) {
        setVoiceError(getVoiceChatErrorMessage(err))
        if (voiceSessionOpenRef.current) {
          await resumeListening()
        }
      } finally {
        if (voiceSessionOpenRef.current) {
          setVoiceProcessing(false)
        }
      }
    },
    [
      activeDocument?.id,
      applySession,
      voiceCapabilities?.tts_server,
      closeVoiceSession,
      resumeListening,
    ]
  )

  useEffect(() => {
    sendVoiceMessageRef.current = sendVoiceMessage
  }, [sendVoiceMessage])

  const startVoiceSession = useCallback(async () => {
    if (voiceProcessing || loading || uploading || voiceSessionOpen) return

    recorder.clearRecorderError()
    setVoiceError(null)
    stopSpeaking()
    voiceSessionOpenRef.current = true
    setVoiceSessionOpen(true)
    setVoiceMode('listening')

    if (!voiceSttAvailable) {
      setVoiceError('Voice input is not enabled on the server.')
      return
    }

    if (!recorder.isSupported) {
      setVoiceError(recorder.supportReason ?? 'Voice is not available on this device.')
      return
    }

    const result = await recorder.startRecording(blob => {
      void sendVoiceMessageRef.current(blob)
    })
    if (!result.ok) {
      setVoiceError(result.error)
    }
  }, [
    voiceProcessing,
    loading,
    uploading,
    voiceSessionOpen,
    recorder,
    voiceSttAvailable,
  ])

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
    closeVoiceSession()
    setError(null)
    setUploadError(null)
    setVoiceError(null)
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
  }, [applySession, closeVoiceSession])

  const voiceStatusText =
    voiceMode === 'listening'
      ? recorder.isUserSpeaking
        ? 'Listening…'
        : 'Speak now'
      : voiceMode === 'processing'
        ? 'Thinking…'
        : 'Tild is speaking…'

  return {
    messages,
    loading,
    uploading,
    voiceProcessing,
    error,
    uploadError,
    voiceError: voiceError || recorder.recorderError,
    activeDocument,
    showSuggestedPrompts,
    suggestedPrompts: SUGGESTED_PROMPTS,
    voiceDisabledHint,
    voiceSessionOpen,
    voiceMode,
    voiceStatusText,
    audioLevel: recorder.audioLevel,
    isUserSpeaking: recorder.isUserSpeaking,
    startVoiceSession,
    closeVoiceSession,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts: () => setShowSuggestedPrompts(false),
  }
}
