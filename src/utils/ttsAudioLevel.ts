/** Live TTS playback level (0–1) for AI voice wave visualizer */

let level = 0
let rafId = 0
let analyser: AnalyserNode | null = null
const data = new Uint8Array(128)

export const getTtsAudioLevel = (): number => level

export const attachTtsAnalyser = (audio: HTMLAudioElement): void => {
  stopTtsLevelMonitor()
  try {
    const ctx = new AudioContext()
    const source = ctx.createMediaElementSource(audio)
    const node = ctx.createAnalyser()
    node.fftSize = 256
    node.smoothingTimeConstant = 0.72
    source.connect(node)
    node.connect(ctx.destination)
    analyser = node

    const tick = () => {
      if (!analyser) return
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i]
      level = Math.min(1, (sum / data.length / 255) * 2.2)
      rafId = requestAnimationFrame(tick)
    }
    tick()

    audio.addEventListener(
      'ended',
      () => {
        stopTtsLevelMonitor()
      },
      { once: true }
    )
  } catch {
    level = 0
  }
}

export const stopTtsLevelMonitor = (): void => {
  cancelAnimationFrame(rafId)
  rafId = 0
  analyser = null
  level = 0
}

/** Synthetic pulse when browser TTS is used (no analyser available) */
let syntheticLevel = 0
let syntheticRaf = 0

export const startSyntheticTtsLevel = (): void => {
  stopSyntheticTtsLevel()
  const start = performance.now()
  const tick = () => {
    const t = (performance.now() - start) * 0.001
    syntheticLevel = 0.35 + Math.sin(t * 4.2) * 0.2 + Math.sin(t * 7.1) * 0.12
    syntheticRaf = requestAnimationFrame(tick)
  }
  tick()
}

export const stopSyntheticTtsLevel = (): void => {
  cancelAnimationFrame(syntheticRaf)
  syntheticRaf = 0
  syntheticLevel = 0
}

export const getActiveTtsLevel = (): number =>
  analyser ? level : syntheticLevel
