import React from 'react'
import VoiceOrb, { VoiceOrbMode } from './VoiceOrb'
import '../styles/voice.css'
import '../styles/voice-float.css'

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error?: string | null
  browserActive?: boolean
  onActivate: () => void
  onClose: () => void
}

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const FloatingVoiceWidget: React.FC<Props> = ({
  mode,
  audioLevel,
  isUserSpeaking,
  statusText,
  error,
  browserActive = false,
  onActivate,
  onClose,
}) => {
  const hint =
    browserActive && mode === 'listening'
      ? 'Tap orb to focus Beru'
      : browserActive
        ? '✕ to return to Beru'
        : mode === 'searching'
          ? 'Widget stays on top'
          : mode === 'speaking'
            ? 'Beru is speaking'
            : 'Tap orb to focus Beru'

  return (
    <div className="beru-float-widget" role="status" aria-live="polite">
      <div
        className="beru-float-widget__body"
        onClick={onActivate}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActivate()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={browserActive ? 'Focus Beru to speak' : 'Focus Beru'}
      >
        <div className="beru-float-widget__orb-wrap">
          <VoiceOrb
            mode={mode}
            audioLevel={audioLevel}
            isUserSpeaking={isUserSpeaking}
            size="compact"
          />
        </div>

        <div className="beru-float-widget__meta">
          <span className="beru-float-widget__status">{statusText}</span>
          {error && (
            <p className="beru-float-widget__error" role="alert">
              {error}
            </p>
          )}
          <p className="beru-float-widget__hint">{hint}</p>
        </div>

        <button
          type="button"
          className="beru-float-widget__close"
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Close voice"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

export default FloatingVoiceWidget
