/// <reference types="react-scripts" />

interface ClientAction {
  type: string
  url?: string
  reuse_tab?: boolean
  site?: string
  direction?: string
  amount?: number
  text?: string
}

interface ElectronBrowserState {
  browserOpen: boolean
  currentTabUrl: string | null
  panelVisible: boolean
}

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
      handleClientActions: (actions: ClientAction[]) => Promise<ElectronBrowserState>
      getState: () => Promise<ElectronBrowserState>
      focusApp: () => void
      onState: (callback: (state: ElectronBrowserState) => void) => () => void
    }
  }
}
