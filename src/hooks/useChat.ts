import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Message,
  ActiveDocument,
  ChatResponse,
  VoiceCapabilities,
  VoiceAuthState,
} from '../types'
import {
  sendMessage,
  startChat,
  clearSession,
  uploadDocument,
  voiceChat,
  getVoiceCapabilities,
  getVoiceAuthStatus,
  getApiErrorMessage,
  getVoiceChatErrorMessage,
} from '../services/api'
import { isPdfFile } from '../utils/pdfFile'
import { speakBeruReply, stopSpeaking } from '../utils/speech'
import { isGoodbyeMessage } from '../utils/voiceGoodbye'
import { getMessageDirection } from '../utils/textDirection'
import { useVoiceRecorder, StartRecordingOptions } from './useVoiceRecorder'
import { logVoiceTiming } from '../utils/voiceTiming'
import { VoiceOrbMode } from '../components/VoiceOrb'
import { VoiceUILayout } from '../components/VoiceSessionOverlay'
import { BeruActivity } from '../types'
import {
  applyElectronClientActions,
  focusBeruApp,
  focusBeruAppWhenReplying,
  subscribeElectronBrowserState,
} from '../native/electronBrowser'
import {
  browserStatusText,
  floatOrbModeForBrowser,
  hadCloseTab,
  resolveOpenedUrl,
  shouldEndBrowserSession,
  shouldStartBrowserSession,
} from '../utils/browserSession'
import {
  authFromStatus,
  defaultVoiceAuthState,
  detectVoiceAuthFromStart,
  isChatUnlocked,
  mergeVoiceAuth,
  needsVoiceEnroll,
  needsVoiceWake,
} from '../utils/voiceAuth'

const SUGGESTED_PROMPTS = [
  'Summarize this document',
  'What are the main points?',
  'What is this document about?',
]

const makeBeruMessage = (
  content: string,
  response?: ChatResponse,
  animate = false
): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role: 'beru',
  content,
  timestamp: new Date(),
  language: response?.language,
  text_direction: response?.text_direction,
  animate,
  browser_url: response ? resolveOpenedUrl(response) : undefined,
})

const finalizeAnimating = (prev: Message[]): Message[] =>
  prev.map(m => (m.role === 'beru' && m.animate ? { ...m, animate: false } : m))

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
  const [voiceAuth, setVoiceAuth] = useState<VoiceAuthState>(defaultVoiceAuthState)
  const [authReady, setAuthReady] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)

  const [voiceSessionOpen, setVoiceSessionOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState<VoiceOrbMode>('listening')
  const [browserSessionActive, setBrowserSessionActive] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browserPanelVisible, setBrowserPanelVisible] = useState(false)
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)
  const [browserActivity, setBrowserActivity] = useState<BeruActivity | null>(null)
  const [browserStatus, setBrowserStatus] = useState('')
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)
  const voiceSessionOpenRef = useRef(false)
  const sendVoiceMessageRef = useRef<(audio: Blob) => Promise<void>>(async () => {})
  const autoWakeStartedRef = useRef(false)

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

  const applyAuthFromResponse = useCallback((response: ChatResponse) => {
    setVoiceAuth(prev => mergeVoiceAuth(prev, response))
  }, [])

  const refreshVoiceAuth = useCallback(async () => {
    const status = await getVoiceAuthStatus()
    if (status) {
      setVoiceAuth(authFromStatus(status))
    }
  }, [])

  const chatUnlocked = isChatUnlocked(voiceAuth)
  const voiceEnrollRequired = needsVoiceEnroll(voiceAuth)
  const awaitingVoiceWake = needsVoiceWake(voiceAuth)

  useEffect(() => {
    voiceSessionOpenRef.current = voiceSessionOpen
  }, [voiceSessionOpen])

  const endBrowserSession = useCallback(() => {
    setBrowserSessionActive(false)
    setBrowserOpen(false)
    setBrowserPanelVisible(false)
    setCurrentTabUrl(null)
    setBrowserActivity(null)
    setBrowserStatus('')
    setBrowserUrl(null)
    focusBeruApp()
  }, [])

  const syncBrowserUiFromResponse = useCallback(
    (
      response: ChatResponse,
      electronState: {
        browserOpen: boolean
        currentTabUrl: string | null
        panelVisible: boolean
      } | null
    ) => {
      const tabUrl =
        resolveOpenedUrl(response) ?? electronState?.currentTabUrl ?? null
      const tabOpen = response.browser_open ?? electronState?.browserOpen ?? false

      setBrowserOpen(tabOpen)
      if (electronState) setBrowserPanelVisible(electronState.panelVisible)
      setCurrentTabUrl(tabUrl)
      if (tabUrl) setBrowserUrl(tabUrl)
      else if (hadCloseTab(response) || !tabOpen) setBrowserUrl(null)

      if (shouldEndBrowserSession(response)) {
        setBrowserSessionActive(false)
        setBrowserActivity(null)
        setBrowserStatus('')
        setBrowserOpen(tabOpen)
        if (!tabOpen) {
          setBrowserUrl(null)
          setCurrentTabUrl(null)
        }
        focusBeruApp()
        return
      }

      if (shouldStartBrowserSession(response) || tabOpen) {
        const activity =
          response.activity ??
          (tabUrl ? 'browsing' : 'searching')
        setBrowserSessionActive(true)
        setBrowserActivity(activity as BeruActivity)
        setBrowserStatus(browserStatusText(activity as BeruActivity, response))
        if (voiceSessionOpenRef.current) {
          void recorder.resumeAudioContext()
        }
      } else if (hadCloseTab(response) && !tabOpen) {
        setBrowserSessionActive(false)
        setBrowserActivity(null)
        setBrowserStatus('')
      }
    },
    [recorder]
  )

  const applyBeruResponse = useCallback(
    async (response: ChatResponse) => {
      const electronState = await applyElectronClientActions(response)
      syncBrowserUiFromResponse(response, electronState)
    },
    [syncBrowserUiFromResponse]
  )

  useEffect(() => {
    const unsub = subscribeElectronBrowserState(state => {
      setBrowserOpen(state.browserOpen)
      setBrowserPanelVisible(state.panelVisible)
      setCurrentTabUrl(state.currentTabUrl)
      if (state.currentTabUrl) setBrowserUrl(state.currentTabUrl)
      if (!state.browserOpen) {
        setCurrentTabUrl(null)
      }
    })
    return () => unsub?.()
  }, [])

  const closeVoiceSession = useCallback(() => {
    stopSpeaking()
    recorder.cancelRecording()
    voiceSessionOpenRef.current = false
    setVoiceSessionOpen(false)
    setVoiceProcessing(false)
    setVoiceError(null)
    setVoiceMode('listening')
  }, [recorder])

  const beginVoiceThinking = useCallback(() => {
    stopSpeaking()
    setVoiceMode('processing')
    setVoiceProcessing(true)
    setVoiceError(null)
    setError(null)
    setShowSuggestedPrompts(false)
  }, [])

  const voiceRecordingOptions = useCallback(
    (): StartRecordingOptions => ({
      onAutoStopPending: beginVoiceThinking,
      onAutoStop: blob => void sendVoiceMessageRef.current(blob),
    }),
    [beginVoiceThinking]
  )

  const resumeListening = useCallback(async () => {
    if (!voiceSessionOpenRef.current) return

    setVoiceError(null)
    setVoiceMode('listening')
    setVoiceProcessing(false)

    const result = await recorder.startRecording(voiceRecordingOptions())
    if (result.ok) {
      await recorder.resumeAudioContext()
    } else {
      setVoiceError(result.error)
    }
  }, [recorder, voiceRecordingOptions])

  useEffect(() => {
    const init = async () => {
      try {
        const [authStatus, startRes, voiceCaps] = await Promise.all([
          getVoiceAuthStatus(),
          startChat(),
          getVoiceCapabilities().catch(() => null),
        ])
        if (voiceCaps) {
          setVoiceCapabilities(voiceCaps)
        }

        let auth = defaultVoiceAuthState()
        if (authStatus) {
          auth = authFromStatus(authStatus)
        } else if (detectVoiceAuthFromStart(startRes)) {
          auth = mergeVoiceAuth(auth, {
            voice_auth_enabled: true,
            voice_enrolled: startRes.voice_enrolled,
            awaiting_voice_wake: startRes.awaiting_voice_wake,
            session_identified: startRes.session_identified,
            is_owner: startRes.is_owner,
            voice_verified: startRes.voice_verified,
          })
        }

        setVoiceAuth(auth)
        applySession(startRes)
        applyAuthFromResponse(startRes)
        setMessages([makeBeruMessage(startRes.response, startRes)])

        if (needsVoiceEnroll(auth)) {
          setShowEnrollModal(true)
        }
      } catch {
        setMessages([makeBeruMessage('Hey! I am Beru. Who am I talking to?')])
      } finally {
        setAuthReady(true)
      }
    }
    init()
  }, [applySession, applyAuthFromResponse])

  const appendBeruReply = useCallback(
    (response: ChatResponse, animate = true) => {
      applySession(response)
      applyAuthFromResponse(response)
      void applyBeruResponse(response)
      setMessages(prev => [
        ...finalizeAnimating(prev),
        makeBeruMessage(response.response, response, animate),
      ])
      focusBeruAppWhenReplying()
    },
    [applySession, applyAuthFromResponse, applyBeruResponse]
  )

  const sendUserMessage = useCallback(
    async (content: string, documentId?: string) => {
      if (!content.trim()) return

      if (!isChatUnlocked(voiceAuth)) {
        setError('Use voice: say "Beru" or "Wake up Beru" into the mic.')
        return
      }

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
        appendBeruReply(response)
      } catch (err) {
        setError(
          getApiErrorMessage(err, 'Could not connect to Beru. Make sure the server is running!')
        )
      } finally {
        setLoading(false)
      }
    },
    [activeDocument?.id, appendBeruReply, voiceAuth]
  )

  const sendVoiceMessage = useCallback(
    async (audio: Blob) => {
      if (!voiceSessionOpenRef.current) return

      if (!audio.size) {
        setVoiceError('No audio captured. Try again.')
        setVoiceMode('listening')
        setVoiceProcessing(false)
        await resumeListening()
        return
      }

      const useServerTts = voiceCapabilities?.tts_server !== false

      try {
        const response = await voiceChat(audio, {
          document_id: activeDocument?.id,
          include_audio: useServerTts,
        })

        logVoiceTiming(response.timing_ms)
        if (response.audio_error) {
          console.warn('[Beru voice] embedded TTS failed:', response.audio_error)
        }

        const transcript = response.transcript?.trim()
        if (!transcript) {
          setVoiceError('Could not understand audio, try again')
          setVoiceMode('listening')
          setVoiceProcessing(false)
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
        applyAuthFromResponse(response)
        await applyBeruResponse(response)
        setMessages(prev => [
          ...finalizeAnimating(prev),
          userMessage,
          makeBeruMessage(response.response, response, true),
        ])
        focusBeruAppWhenReplying()

        if (response.awaiting_voice_wake) {
          autoWakeStartedRef.current = false
        }

        if (shouldEndBrowserSession(response)) {
          setVoiceMode('speaking')
        } else if (shouldStartBrowserSession(response)) {
          setVoiceMode('searching')
        } else {
          setVoiceMode('speaking')
        }
        setVoiceProcessing(false)

        const replyLang = response.language || response.transcript_language || 'en'
        const embeddedAudio =
          useServerTts && response.audio_base64
            ? {
                base64: response.audio_base64,
                mimeType: response.audio_mime || 'audio/mpeg',
              }
            : null

        await speakBeruReply(
          response.response,
          replyLang,
          useServerTts,
          embeddedAudio
        )

        if (endingSession) {
          closeVoiceSession()
          return
        }

        await resumeListening()
      } catch (err) {
        setVoiceError(getVoiceChatErrorMessage(err))
        setVoiceMode('listening')
        setVoiceProcessing(false)
        if (voiceSessionOpenRef.current) {
          await resumeListening()
        }
      }
    },
    [
      activeDocument?.id,
      applySession,
      voiceCapabilities?.tts_server,
      closeVoiceSession,
      resumeListening,
      applyBeruResponse,
      applyAuthFromResponse,
    ]
  )

  useEffect(() => {
    sendVoiceMessageRef.current = sendVoiceMessage
  }, [sendVoiceMessage])

  const startVoiceSession = useCallback(async () => {
    if (voiceProcessing || loading || uploading || voiceSessionOpen) return

    if (voiceEnrollRequired) {
      setShowEnrollModal(true)
      setVoiceError('Enroll your voice first (Settings).')
      return
    }

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

    const result = await recorder.startRecording(voiceRecordingOptions())
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
    voiceEnrollRequired,
    voiceRecordingOptions,
  ])

  useEffect(() => {
    if (!authReady || !awaitingVoiceWake || voiceSessionOpen) return
    if (autoWakeStartedRef.current) return
    autoWakeStartedRef.current = true
    void startVoiceSession()
  }, [authReady, awaitingVoiceWake, voiceSessionOpen, startVoiceSession])

  const rejectInvalidPdf = useCallback(() => {
    setUploadError('Only PDF files are supported.')
  }, [])

  const uploadPdf = useCallback(
    async (file: File) => {
      if (!isPdfFile(file)) {
        rejectInvalidPdf()
        return
      }

      if (!isChatUnlocked(voiceAuth)) {
        setUploadError('Use voice: say "Beru" or "Wake up Beru" into the mic.')
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
          makeBeruMessage(response.message, undefined, true),
        ])
        focusBeruAppWhenReplying()
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
    [rejectInvalidPdf, voiceAuth]
  )

  const returnToApp = useCallback(() => {
    endBrowserSession()
    focusBeruApp()
  }, [endBrowserSession])

  const activateVoiceFromOverlay = useCallback(async () => {
    focusBeruApp()
    await recorder.resumeAudioContext()
    if (voiceSessionOpenRef.current && voiceMode !== 'processing') {
      if (!recorder.isRecording) {
        await resumeListening()
      }
    }
  }, [recorder, resumeListening, voiceMode])

  useEffect(() => {
    if (!voiceSessionOpen) return undefined

    const onFocus = () => {
      void recorder.resumeAudioContext()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    const unsubActivate = window.electronAPI?.voiceOverlay?.onActivate?.(() => {
      void activateVoiceFromOverlay()
    })

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      unsubActivate?.()
    }
  }, [voiceSessionOpen, recorder, activateVoiceFromOverlay])

  const clearChat = useCallback(async () => {
    closeVoiceSession()
    setError(null)
    setUploadError(null)
    setVoiceError(null)
    setShowSuggestedPrompts(false)

    autoWakeStartedRef.current = false

    try {
      const response = await clearSession()
      applySession(response)
      applyAuthFromResponse(response)
      setMessages([makeBeruMessage(response.response, response)])
    } catch {
      try {
        const response = await startChat()
        applySession(response)
        applyAuthFromResponse(response)
        setMessages([makeBeruMessage(response.response, response)])
      } catch {
        setActiveDocument(null)
        setMessages([makeBeruMessage('Hey! I am Beru. Who am I talking to?')])
      }
    }
  }, [applySession, applyAuthFromResponse, closeVoiceSession])

  const voiceStatusText =
    voiceMode === 'searching'
      ? browserStatus || 'Searching the web…'
      : voiceMode === 'listening'
        ? recorder.isUserSpeaking
          ? 'Listening…'
          : awaitingVoiceWake
            ? 'Say "Beru" or "Wake up Beru"'
            : 'Speak now'
        : voiceMode === 'processing'
          ? 'Thinking…'
          : 'Beru is speaking…'

  const floatStatusText = (() => {
    if (awaitingVoiceWake && voiceSessionOpen && voiceMode === 'listening') {
      return 'Say "Beru" or "Wake up Beru"'
    }
    if (browserSessionActive && voiceSessionOpen && voiceMode === 'listening') {
      return 'Listening. Tap orb if no reply'
    }
    if (browserSessionActive && !voiceSessionOpen) {
      return browserStatus || 'Browsing…'
    }
    if (browserSessionActive) {
      return browserStatus || voiceStatusText
    }
    return voiceStatusText
  })()

  const floatOrbMode: VoiceOrbMode =
    browserSessionActive && !voiceSessionOpen
      ? floatOrbModeForBrowser(browserActivity ?? 'searching')
      : voiceMode

  const voiceUILayout: VoiceUILayout =
    voiceSessionOpen && voiceMode === 'listening' && !browserSessionActive
      ? 'immersive'
      : 'companion'

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
    voiceUILayout,
    voiceStatusText,
    floatStatusText,
    floatOrbMode,
    browserSessionActive,
    browserOpen,
    browserPanelVisible,
    currentTabUrl,
    browserUrl,
    browserActivity,
    returnToApp,
    activateVoiceFromOverlay,
    audioLevel: recorder.audioLevel,
    isUserSpeaking: recorder.isUserSpeaking,
    startVoiceSession,
    closeVoiceSession,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts: () => setShowSuggestedPrompts(false),
    authReady,
    chatUnlocked,
    voiceEnrollRequired,
    awaitingVoiceWake,
    showEnrollModal,
    setShowEnrollModal,
    refreshVoiceAuth,
  }
}
