import { VoiceOrbMode } from '../components/VoiceOrb'
import { VoiceUILayout } from '../components/VoiceSessionOverlay'

export interface ElectronVoiceOverlayState {
  open: boolean
  mode: VoiceOrbMode
  layout: VoiceUILayout
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error: string | null
  browserUrl?: string | null
  browserActive?: boolean
}

export const isElectronApp = (): boolean =>
  typeof window !== 'undefined' && !!window.electronAPI?.voiceOverlay

/** Float widget: entire voice session + active browser/search session */
export const shouldUseElectronFloatOverlay = (
  voiceSessionOpen: boolean,
  browserSessionActive: boolean
): boolean =>
  isElectronApp() && (voiceSessionOpen || browserSessionActive)

export const publishElectronVoiceOverlay = (
  state: ElectronVoiceOverlayState
): void => {
  window.electronAPI?.voiceOverlay.publishState(state)
}
