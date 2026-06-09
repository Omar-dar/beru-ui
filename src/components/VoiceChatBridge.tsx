import React, { useEffect, useRef } from 'react'
import { VoiceOrbMode } from './VoiceOrb'

interface Props {
  mode: VoiceOrbMode
  audioLevel: number
  active: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

const modeHue: Record<VoiceOrbMode, number> = {
  listening: 195,
  processing: 255,
  speaking: 210,
  searching: 185,
}

const VoiceChatBridge: React.FC<Props> = ({ mode, audioLevel, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef(0)
  const modeRef = useRef(mode)
  const levelRef = useRef(audioLevel)
  const activeRef = useRef(active)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    levelRef.current = audioLevel
  }, [audioLevel])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawn = (w: number, count: number) => {
      const hue = modeHue[modeRef.current]
      const boost = 0.4 + levelRef.current * 1.2
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: w * 0.5 + (Math.random() - 0.5) * 48,
          y: 4 + Math.random() * 8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.6 + Math.random() * 1.4 * boost,
          life: 0,
          maxLife: 50 + Math.random() * 40,
          size: 1 + Math.random() * 2.5 * boost,
          hue: hue + (Math.random() - 0.5) * 30,
        })
      }
    }

    let frame = 0

    const tick = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      frame++
      ctx.clearRect(0, 0, w, h)

      if (activeRef.current) {
        const rate = modeRef.current === 'processing' ? 3 : modeRef.current === 'speaking' ? 2 : 4
        if (frame % rate === 0) {
          spawn(w, modeRef.current === 'listening' ? 2 : 3)
        }

        const cx = w * 0.5
        const glowHue = modeHue[modeRef.current]
        const pulse = 0.35 + levelRef.current * 0.45
        const beam = ctx.createLinearGradient(cx, 0, cx, h)
        beam.addColorStop(0, `hsla(${glowHue}, 90%, 72%, ${0.22 * pulse})`)
        beam.addColorStop(0.35, `hsla(${glowHue}, 80%, 60%, ${0.1 * pulse})`)
        beam.addColorStop(1, 'hsla(240, 40%, 20%, 0)')
        ctx.fillStyle = beam
        ctx.fillRect(cx - 60, 0, 120, h)

        const mesh = ctx.createRadialGradient(cx, 0, 0, cx, 0, w * 0.45)
        mesh.addColorStop(0, `hsla(${glowHue}, 100%, 80%, ${0.12 * pulse})`)
        mesh.addColorStop(1, 'transparent')
        ctx.fillStyle = mesh
        ctx.fillRect(0, 0, w, h * 0.5)
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.04
        return p.life < p.maxLife && p.y < h + 8
      })

      for (const p of particlesRef.current) {
        const t = 1 - p.life / p.maxLife
        const alpha = t * t * (0.25 + levelRef.current * 0.35)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 85%, 75%, ${alpha})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      particlesRef.current = []
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="voice-chat-bridge"
      aria-hidden
    />
  )
}

export default VoiceChatBridge
