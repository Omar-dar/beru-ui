/// <reference types="react-scripts" />

interface ElectronVoiceOverlayState {
  open: boolean
  mode: 'listening' | 'processing' | 'speaking' | 'searching'
  layout: 'immersive' | 'companion'
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error: string | null
  browserUrl?: string | null
  browserActive?: boolean
}

interface Window {
  electronAPI?: {
    platform: string
    voiceOverlay: {
      publishState: (state: ElectronVoiceOverlayState) => void
      ready: () => void
      requestClose: () => void
      activate: () => void
      onState: (callback: (state: ElectronVoiceOverlayState) => void) => () => void
      onCloseRequest: (callback: () => void) => () => void
      onActivate: (callback: () => void) => () => void
    }
    browser: {
      openUrl: (url: string) => Promise<boolean>
      focusApp: () => void
    }
  }
}
