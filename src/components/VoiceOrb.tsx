import React, { useEffect, useState } from 'react'
import SmokeRingCanvas from './SmokeRingCanvas'
import VoiceWaveCanvas from './VoiceWaveCanvas'

export type VoiceOrbMode = 'listening' | 'processing' | 'speaking' | 'searching'

export type VoiceOrbSize = 'full' | 'compact'

const fullOrbPx = (width: number) => {
  if (width <= 480) return 160
  if (width <= 768) return 190
  if (width <= 900 && window.innerHeight <= 500) return 140
  return 220
}

const compactOrbPx = (width: number) => (width <= 480 ? 64 : 80)

const useOrbPixels = (size: VoiceOrbSize): number => {
  const [px, setPx] = useState(() =>
    size === 'full' ? fullOrbPx(window.innerWidth) : compactOrbPx(window.innerWidth)
  )

  useEffect(() => {
    const onResize = () => {
      setPx(size === 'full' ? fullOrbPx(window.innerWidth) : compactOrbPx(window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [size])

  return px
}

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  size?: VoiceOrbSize
}

const VoiceOrb: React.FC<Props> = ({
  mode,
  audioLevel,
  isUserSpeaking,
  size = 'full',
}) => {
  const px = useOrbPixels(size)
  const isUserVisual = mode === 'listening' || mode === 'processing' || mode === 'searching'
  const reactiveScale =
    mode === 'listening' ? 1 + audioLevel * 0.2 + (isUserSpeaking ? 0.06 : 0) : 1

  return (
    <div
      className={`voice-orb-wrap voice-orb-wrap--${mode} voice-orb-wrap--${size} voice-orb-wrap--${isUserVisual ? 'user' : 'ai'}`}
      style={
        {
          '--orb-scale': reactiveScale,
          width: px,
          height: px,
        } as React.CSSProperties
      }
    >
      <div className="voice-orb-visual-stage">
        {mode === 'speaking' ? (
          <VoiceWaveCanvas size={px} />
        ) : (
          <SmokeRingCanvas
            mode={mode}
            audioLevel={audioLevel}
            isUserSpeaking={isUserSpeaking}
            size={px}
          />
        )}
      </div>
      {mode === 'searching' && <div className="voice-orb-search-halo" aria-hidden />}
    </div>
  )
}

export default VoiceOrb
