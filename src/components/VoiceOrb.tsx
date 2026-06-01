import React from 'react'

export type VoiceOrbMode = 'listening' | 'processing' | 'speaking'

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
}

const VoiceOrb: React.FC<Props> = ({ mode, audioLevel, isUserSpeaking }) => {
  const reactiveScale =
    mode === 'listening' ? 1 + audioLevel * 0.45 + (isUserSpeaking ? 0.12 : 0) : 1

  return (
    <div
      className={`voice-orb-wrap voice-orb-wrap--${mode}`}
      style={{ '--orb-scale': reactiveScale } as React.CSSProperties}
    >
      <div className="voice-orb-glow voice-orb-glow--outer" />
      <div className="voice-orb-glow voice-orb-glow--mid" />
      <div className="voice-orb-core">
        <div className="voice-orb-shine" />
      </div>
      <div className="voice-orb-ring voice-orb-ring--1" />
      <div className="voice-orb-ring voice-orb-ring--2" />
    </div>
  )
}

export default VoiceOrb
