import React from 'react'
import VoiceOrb, { VoiceOrbMode } from './VoiceOrb'
import '../styles/voice.css'

export type VoiceUILayout = 'immersive' | 'companion'

interface Props {
  open: boolean
  layout: VoiceUILayout
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error?: string | null
  onClose: () => void
  /** Electron always-on-top float window (no fullscreen backdrop) */
  floating?: boolean
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const VoiceSessionOverlay: React.FC<Props> = ({
  open,
  layout,
  mode,
  audioLevel,
  isUserSpeaking,
  statusText,
  error,
  onClose,
  floating = false,
}) => {
  if (!open) return null

  const isImmersive = layout === 'immersive'
  const orbSize = isImmersive ? 'full' : 'compact'

  const hint =
    error
      ? 'Fix the issue, then try again or close.'
      : mode === 'searching'
        ? 'Searching the web for you…'
        : mode === 'listening'
          ? 'Speak in any language. Pause when done.'
          : mode === 'speaking'
            ? 'Beru is speaking. Read along below.'
            : 'Transcribing & thinking…'

  return (
    <div
      className={`voice-session voice-session--${layout}${floating ? ' voice-session--floating' : ''}`}
      role="dialog"
      aria-modal={isImmersive && !floating}
      aria-label="Voice chat"
    >
      <div
        className="voice-session-backdrop"
        onClick={isImmersive ? onClose : undefined}
        aria-hidden
      />

      <div className="voice-session-anchor">
        <div className="voice-session-panel">
          <button
            type="button"
            className="voice-session-close"
            onClick={onClose}
            aria-label="Close voice chat"
          >
            <CloseIcon />
          </button>

          <div className="voice-session-orb-col">
            <VoiceOrb
              mode={mode}
              audioLevel={audioLevel}
              isUserSpeaking={isUserSpeaking}
              size={orbSize}
            />
          </div>

          <div className="voice-session-meta">
            <p className="voice-session-status">
              {mode === 'searching' && (
                <span className="voice-session-badge" aria-hidden>
                  WEB
                </span>
              )}
              {statusText}
            </p>

            {error && (
              <p className="voice-session-error" role="alert">
                {error}
              </p>
            )}

            <p className="voice-session-hint">{hint}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceSessionOverlay
