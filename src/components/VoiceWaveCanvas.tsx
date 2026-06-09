import React, { useEffect, useRef } from 'react'
import { getActiveTtsLevel } from '../utils/ttsAudioLevel'

interface WaveBand {
  yOffset: number
  freq: number
  phase: number
  amp: number
  speed: number
  thickness: number
}

interface Props {
  size: number
}

const BAND_COUNT = 9

const createBands = (): WaveBand[] =>
  Array.from({ length: BAND_COUNT }, (_, i) => {
    const t = i / (BAND_COUNT - 1)
    return {
      yOffset: (t - 0.5) * 0.7,
      freq: 0.018 + Math.random() * 0.025,
      phase: Math.random() * Math.PI * 2,
      amp: 0.35 + Math.random() * 0.45,
      speed: 0.8 + Math.random() * 1.4,
      thickness: 2.5 + Math.random() * 3,
    }
  })

const VoiceWaveCanvas: React.FC<Props> = ({ size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bandsRef = useRef<WaveBand[]>(createBands())

  useEffect(() => {
    bandsRef.current = createBands()
  }, [size])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf = 0
    let start = performance.now()

    const draw = (now: number) => {
      const t = now - start
      const tts = getActiveTtsLevel()
      const energy = 0.25 + tts * 0.75
      const w = size
      const h = size
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55)
      glow.addColorStop(0, `rgba(200,230,255,${0.06 * energy})`)
      glow.addColorStop(0.5, `rgba(180,210,255,${0.04 * energy})`)
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      for (let bi = 0; bi < bandsRef.current.length; bi++) {
        const band = bandsRef.current[bi]
        const baseY = cy + band.yOffset * h * 0.55
        const amplitude = band.amp * h * 0.14 * energy
        const drift = t * 0.0012 * band.speed

        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const nx = (x / w) * 2 - 1
          const envelope = Math.pow(1 - nx * nx, 0.55)
          const wave1 = Math.sin(x * band.freq + drift + band.phase) * amplitude * envelope
          const wave2 =
            Math.sin(x * band.freq * 2.3 - drift * 1.4 + band.phase * 1.7) *
            amplitude *
            0.35 *
            envelope
          const smoke =
            Math.sin(x * 0.06 + t * 0.0025 + bi) * amplitude * 0.15 * envelope
          const y = baseY + wave1 + wave2 + smoke
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        const alpha = (0.12 + band.amp * 0.18) * energy * (0.7 + tts * 0.5)
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(alpha, 0.65)})`
        ctx.lineWidth = band.thickness * (0.7 + tts * 0.6)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = 'rgba(200,230,255,0.75)'
        ctx.shadowBlur = 14 + tts * 10
        ctx.stroke()

        ctx.beginPath()
        for (let x = 0; x <= w; x += 3) {
          const nx = (x / w) * 2 - 1
          const envelope = Math.pow(1 - nx * nx, 0.6)
          const y =
            baseY +
            Math.sin(x * band.freq * 1.5 + drift * 0.8 + band.phase) *
              amplitude *
              0.5 *
              envelope
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(180,220,255,${alpha * 0.4})`
        ctx.lineWidth = band.thickness * 1.8
        ctx.shadowBlur = 22
        ctx.stroke()
      }

      ctx.restore()

      for (let i = 0; i < 12; i++) {
        const px = cx + Math.sin(t * 0.002 + i * 1.8) * w * 0.35
        const py = cy + Math.cos(t * 0.0015 + i * 2.1) * h * 0.2
        const r = 2 + tts * 4 + (i % 3)
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 3)
        g.addColorStop(0, `rgba(255,255,255,${0.15 * energy})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, r * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!prefersReduced) {
        raf = requestAnimationFrame(draw)
      }
    }

    if (prefersReduced) {
      draw(start)
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={canvasRef} className="voice-wave-canvas" aria-hidden />
}

export default VoiceWaveCanvas
