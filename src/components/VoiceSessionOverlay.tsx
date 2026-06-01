import React from 'react'
import VoiceOrb, { VoiceOrbMode } from './VoiceOrb'
import '../styles/voice.css'

interface Props {
  open: boolean
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error?: string | null
  onClose: () => void
}

const VoiceSessionOverlay: React.FC<Props> = ({
  open,
  mode,
  audioLevel,
  isUserSpeaking,
  statusText,
  error,
  onClose,
}) => {
  if (!open) return null

  return (
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Voice chat">
      <div className="voice-overlay-backdrop" onClick={onClose} aria-hidden />
      <div className="voice-overlay-panel">
        <button
          type="button"
          className="voice-overlay-close"
          onClick={onClose}
          aria-label="Close voice chat"
        >
          ✕
        </button>

        <VoiceOrb
          mode={mode}
          audioLevel={audioLevel}
          isUserSpeaking={isUserSpeaking}
        />

        <p className="voice-overlay-status">{statusText}</p>

        {error && (
          <p className="voice-overlay-error" role="alert">
            {error}
          </p>
        )}

        <p className="voice-overlay-hint">
          {error
            ? 'Fix the issue above, then tap the mic again or close.'
            : mode === 'listening'
              ? 'Speak in any language — pause when done. Say goodbye or tap ✕ to end.'
              : mode === 'speaking'
                ? 'Tild is speaking…'
                : 'Transcribing & thinking…'}
        </p>
      </div>
    </div>
  )
}

export default VoiceSessionOverlay
