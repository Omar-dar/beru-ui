import React, { useEffect, useRef } from 'react'
import { VoiceOrbMode } from './VoiceOrb'

interface Wisp {
  angle: number
  drift: number
  length: number
  thickness: number
  opacity: number
  speed: number
  phase: number
}

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  isUserSpeaking: boolean
  size: number
}

const WISP_COUNT = 28

const createWisps = (): Wisp[] =>
  Array.from({ length: WISP_COUNT }, (_, i) => ({
    angle: (i / WISP_COUNT) * Math.PI * 2 + Math.random() * 0.3,
    drift: 6 + Math.random() * 14,
    length: 0.35 + Math.random() * 0.55,
    thickness: 8 + Math.random() * 14,
    opacity: 0.18 + Math.random() * 0.35,
    speed: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
  }))

const SmokeRingCanvas: React.FC<Props> = ({
  mode,
  audioLevel,
  isUserSpeaking,
  size,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wispsRef = useRef<Wisp[]>(createWisps())
  const modeRef = useRef(mode)
  const audioRef = useRef(audioLevel)
  const speakingRef = useRef(isUserSpeaking)

  modeRef.current = mode
  audioRef.current = audioLevel
  speakingRef.current = isUserSpeaking

  useEffect(() => {
    wispsRef.current = createWisps()
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

    const cx = size / 2
    const cy = size / 2
    const baseRadius = size * 0.34
    let raf = 0
    let start = performance.now()

    const modeSpeed = (m: VoiceOrbMode) => {
      switch (m) {
        case 'listening':
          return 1
        case 'processing':
          return 1.6
        case 'searching':
          return 2
        default:
          return 1
      }
    }

    const draw = (now: number) => {
      const m = modeRef.current
      const audio = audioRef.current
      const userSpeaking = speakingRef.current
      const t = now - start
      const speedMul = modeSpeed(m)

      const reactive =
        m === 'listening'
          ? 1 + audio * 0.35 + (userSpeaking ? 0.15 : 0)
          : m === 'processing'
            ? 1 + Math.sin(t * 0.004) * 0.06
            : 1 + Math.sin(t * 0.005) * 0.05

      const radius = baseRadius * reactive
      const intensity =
        m === 'listening' && userSpeaking
          ? 0.85 + audio * 0.4
          : m === 'processing'
            ? 0.7
            : m === 'searching'
              ? 0.8
              : 0.55 + audio * 0.25

      ctx.clearRect(0, 0, size, size)

      const halo = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.5)
      halo.addColorStop(0, 'rgba(255,255,255,0)')
      halo.addColorStop(0.45, `rgba(255,255,255,${0.04 * intensity})`)
      halo.addColorStop(0.75, `rgba(255,255,255,${0.1 * intensity})`)
      halo.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, size, size)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let layer = 0; layer < 5; layer++) {
        const rot = t * 0.0006 * speedMul * (layer % 2 === 0 ? 1 : -1) + layer * 0.9
        const layerOpacity = (0.06 + layer * 0.018) * intensity
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.04) {
          const n1 = Math.sin(a * 4 + t * 0.0035 * speedMul + layer * 1.2) * (8 + layer * 2)
          const n2 = Math.cos(a * 6 - t * 0.0025 * speedMul + layer) * (5 + layer)
          const n3 = Math.sin(a * 11 + t * 0.0045 * speedMul) * 3
          const r = radius + n1 + n2 + n3
          const x = cx + Math.cos(a + rot) * r
          const y = cy + Math.sin(a + rot) * r
          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = `rgba(255,255,255,${layerOpacity})`
        ctx.lineWidth = 10 + layer * 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = 'rgba(255,255,255,0.6)'
        ctx.shadowBlur = 14 + layer * 3
        ctx.stroke()
      }
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const wisp of wispsRef.current) {
        const spin = t * 0.001 * wisp.speed * speedMul + wisp.phase
        const angle = wisp.angle + spin
        const wobble =
          Math.sin(angle * 3 + t * 0.003 * speedMul) * wisp.drift +
          Math.cos(angle * 5 - t * 0.0025 * speedMul) * (wisp.drift * 0.45)
        const r = radius + wobble
        const arcLen = wisp.length * (0.7 + Math.sin(t * 0.004 + wisp.phase) * 0.15)

        ctx.beginPath()
        for (let s = 0; s <= 1; s += 0.08) {
          const a = angle - arcLen / 2 + arcLen * s
          const localWobble = Math.sin(a * 8 + t * 0.005 * speedMul + wisp.phase) * 4
          const px = cx + Math.cos(a) * (r + localWobble)
          const py = cy + Math.sin(a) * (r + localWobble)
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }

        const alpha = wisp.opacity * intensity * (0.6 + Math.sin(t * 0.003 + wisp.phase) * 0.4)
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(alpha, 0.75)})`
        ctx.lineWidth = wisp.thickness * (0.8 + audio * 0.4)
        ctx.lineCap = 'round'
        ctx.shadowColor = 'rgba(255,255,255,0.85)'
        ctx.shadowBlur = 18
        ctx.stroke()
      }
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2 + t * 0.0008 * speedMul
        const grain = Math.sin(a * 17 + t * 0.008 * speedMul) * 10
        const r = radius + grain
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        const gAlpha = (0.05 + (i % 5) * 0.015) * intensity
        ctx.beginPath()
        ctx.arc(px, py, 1 + (i % 3) * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${gAlpha})`
        ctx.fill()
      }
      ctx.restore()

      if (m === 'searching') {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.beginPath()
        const scanRot = t * 0.0012 * speedMul
        for (let a = 0; a <= Math.PI * 2; a += 0.06) {
          const r = radius + Math.sin(a * 3 + t * 0.004 * speedMul) * 6
          const x = cx + Math.cos(a + scanRot) * r
          const y = cy + Math.sin(a + scanRot) * r
          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = 'rgba(180,240,255,0.12)'
        ctx.lineWidth = 6
        ctx.shadowColor = 'rgba(120,220,255,0.5)'
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()
      }

      const innerCut = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.62)
      innerCut.addColorStop(0, 'rgba(5,5,10,0.92)')
      innerCut.addColorStop(0.7, 'rgba(5,5,10,0.45)')
      innerCut.addColorStop(1, 'rgba(5,5,10,0)')
      ctx.fillStyle = innerCut
      ctx.fillRect(0, 0, size, size)

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

  return <canvas ref={canvasRef} className="smoke-ring-canvas" aria-hidden />
}

export default SmokeRingCanvas
