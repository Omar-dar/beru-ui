import { useState, useEffect, useRef, useCallback } from 'react'

const TICK_MS = 14

function chunkSize(remaining: number, total: number): number {
  if (total > 4000) {
    if (remaining > 2000) return 16
    if (remaining > 800) return 10
    return 6
  }
  if (remaining > 1200) return 8
  if (remaining > 400) return 4
  if (remaining > 80) return 2
  return 1
}

export const useTypewriter = (
  fullText: string,
  enabled: boolean,
  onReveal?: () => void
) => {
  const [visibleCount, setVisibleCount] = useState(() =>
    enabled ? 0 : fullText.length
  )
  const [isComplete, setIsComplete] = useState(!enabled)
  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal

  const finish = useCallback(() => {
    setVisibleCount(fullText.length)
    setIsComplete(true)
  }, [fullText.length])

  useEffect(() => {
    if (!enabled) {
      finish()
      return
    }

    setVisibleCount(0)
    setIsComplete(false)
    let index = 0
    let lastTick = performance.now()
    let frameId = 0

    const step = (now: number) => {
      if (now - lastTick >= TICK_MS) {
        lastTick = now
        const remaining = fullText.length - index
        index = Math.min(index + chunkSize(remaining, fullText.length), fullText.length)
        setVisibleCount(index)
        onRevealRef.current?.()

        if (index >= fullText.length) {
          setIsComplete(true)
          return
        }
      }
      frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [fullText, enabled, finish])

  return {
    visibleText: fullText.slice(0, visibleCount),
    isComplete,
  }
}
