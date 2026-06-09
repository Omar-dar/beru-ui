import React from 'react'
import VoiceOrb, { VoiceOrbMode } from './VoiceOrb'
import VoiceChatBridge from './VoiceChatBridge'
import '../styles/voice-stage.css'

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  statusText: string
  error?: string | null
  onClose: () => void
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const VoiceChatStage: React.FC<Props> = ({
  mode,
  audioLevel,
  isUserSpeaking,
  statusText,
  error,
  onClose,
}) => (
  <section className="voice-chat-stage" aria-label="Voice session">
    <button
      type="button"
      className="voice-chat-stage__close"
      onClick={onClose}
      aria-label="Close voice chat"
    >
      <CloseIcon />
    </button>

    <div className="voice-chat-stage__orb">
      <VoiceOrb
        mode={mode}
        audioLevel={audioLevel}
        isUserSpeaking={isUserSpeaking}
        size="full"
      />
    </div>

    <p className="voice-chat-stage__status">
      {mode === 'searching' && (
        <span className="voice-chat-stage__badge" aria-hidden>
          WEB
        </span>
      )}
      {statusText}
    </p>

    {error && (
      <p className="voice-chat-stage__error" role="alert">
        {error}
      </p>
    )}

    <VoiceChatBridge mode={mode} audioLevel={audioLevel} active />
    <div className="voice-chat-stage__fade" aria-hidden />
  </section>
)

export default VoiceChatStage
