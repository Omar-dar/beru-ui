import { useEffect } from 'react'
import { VoiceOrbMode } from '../components/VoiceOrb'
import {
  publishElectronVoiceOverlay,
  shouldUseElectronFloatOverlay,
} from '../native/electronVoiceOverlay'

interface VoiceOverlaySync {
  voiceSessionOpen: boolean
  floatOrbMode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  floatStatusText: string
  voiceError: string | null
  browserSessionActive: boolean
  browserUrl: string | null
  onCloseRequest: () => void
}

export const useElectronVoiceOverlay = ({
  voiceSessionOpen,
  floatOrbMode,
  audioLevel,
  isUserSpeaking,
  floatStatusText,
  voiceError,
  browserSessionActive,
  browserUrl,
  onCloseRequest,
}: VoiceOverlaySync): boolean => {
  const useFloat = shouldUseElectronFloatOverlay(voiceSessionOpen, browserSessionActive)

  useEffect(() => {
    if (!window.electronAPI?.voiceOverlay) return

    publishElectronVoiceOverlay({
      open: useFloat,
      mode: floatOrbMode,
      layout: 'companion',
      audioLevel,
      isUserSpeaking,
      statusText: floatStatusText,
      error: voiceError,
      browserUrl,
      browserActive: browserSessionActive,
    })
  }, [
    useFloat,
    floatOrbMode,
    audioLevel,
    isUserSpeaking,
    floatStatusText,
    voiceError,
    browserUrl,
    browserSessionActive,
  ])

  useEffect(() => {
    if (!window.electronAPI?.voiceOverlay) return undefined
    return window.electronAPI.voiceOverlay.onCloseRequest(onCloseRequest)
  }, [onCloseRequest])

  useEffect(() => {
    return () => {
      publishElectronVoiceOverlay({
        open: false,
        mode: 'listening',
        layout: 'immersive',
        audioLevel: 0,
        isUserSpeaking: false,
        statusText: '',
        error: null,
        browserActive: false,
      })
    }
  }, [])

  return useFloat
}
