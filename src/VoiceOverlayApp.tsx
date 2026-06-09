import React, { useEffect, useState } from 'react'
import FloatingVoiceWidget from './components/FloatingVoiceWidget'
import { ElectronVoiceOverlayState } from './native/electronVoiceOverlay'
import './styles/voice-float.css'

const VoiceOverlayApp: React.FC = () => {
  const [state, setState] = useState<ElectronVoiceOverlayState | null>(null)

  useEffect(() => {
    document.body.classList.add('voice-overlay-window')
    document.documentElement.classList.add('voice-overlay-window')
    return () => {
      document.body.classList.remove('voice-overlay-window')
      document.documentElement.classList.remove('voice-overlay-window')
    }
  }, [])

  useEffect(() => {
    if (!window.electronAPI?.voiceOverlay) return undefined
    const unsub = window.electronAPI.voiceOverlay.onState(setState)
    window.electronAPI.voiceOverlay.ready()
    return unsub
  }, [])

  if (!state?.open) {
    return <div className="voice-float-empty" aria-hidden />
  }

  return (
    <div className="voice-float-root">
      <FloatingVoiceWidget
        mode={state.mode}
        audioLevel={state.audioLevel}
        isUserSpeaking={state.isUserSpeaking}
        statusText={state.statusText}
        error={state.error}
        browserActive={state.browserActive}
        onActivate={() => window.electronAPI?.voiceOverlay.activate?.()}
        onClose={() => window.electronAPI?.voiceOverlay.requestClose()}
      />
    </div>
  )
}

export default VoiceOverlayApp
