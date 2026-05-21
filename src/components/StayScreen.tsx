import { useCallback, useEffect, useRef, useState } from 'react'
import MistCanvas from './MistCanvas'

interface StayScreenProps {
  onBack: () => void
}

interface RingDef {
  id: string
  message: string
  offset: number
}

interface BgStar {
  x: number
  y: number
  opacity: number
}

interface RiseParticle {
  x: number
  y: number
  vy: number
  opacity: number
}

const RINGS: RingDef[] = [
  { id: 'oya', message: '痛かったね　頑張って生きてきたね', offset: 0 },
  { id: 'hito', message: '今日は今日でおしまい', offset: 1.2 },
  { id: 'naka', message: '手放してみますか？', offset: 2.4 },
  { id: 'kusuri', message: '痛みがあるのは優しいからだよ', offset: 3.6 },
  { id: 'ko', message: 'あなたの一番星に会えますように', offset: 4.8 },
]

const FRAME_MS = 1000 / 30
const RING_RX = 30
const RING_RY = 20
const SWAY_AMP = 8

function createBgStars(w: number, h: number): BgStar[] {
  return Array.from({ length: 20 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    opacity: 0.15 + Math.random() * 0.25,
  }))
}

export default function StayScreen({ onBack }: StayScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const frameCountRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })
  const starsRef = useRef<BgStar[]>([])
  const particlesRef = useRef<RiseParticle[]>([])
  const glowIdRef = useRef<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeMessage, setActiveMessage] = useState<string | null>(null)
  const [messageOpacity, setMessageOpacity] = useState(0)
  const [fading, setFading] = useState(false)

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    hideTimerRef.current = null
    fadeTimerRef.current = null
  }, [])

  const getRingLayout = useCallback((w: number, h: number) => {
    const cy = h * 0.58
    const gap = Math.min(88, (w - 80) / 5)
    const totalW = gap * (RINGS.length - 1)
    const startX = w / 2 - totalW / 2
    return RINGS.map((ring, i) => ({
      ...ring,
      cx: startX + gap * i,
      cy,
    }))
  }, [])

  const spawnParticles = (cx: number, cy: number) => {
    const count = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy,
        vy: -0.4 - Math.random() * 0.3,
        opacity: 0.7 + Math.random() * 0.3,
      })
    }
  }

  const showMessage = useCallback(
    (ring: RingDef, cx: number, cy: number) => {
      clearTimers()
      glowIdRef.current = ring.id
      spawnParticles(cx, cy)
      setFading(false)
      setActiveMessage(ring.message)
      setMessageOpacity(1)

      hideTimerRef.current = setTimeout(() => {
        setFading(true)
        fadeTimerRef.current = setTimeout(() => {
          setActiveMessage(null)
          setMessageOpacity(0)
          setFading(false)
          glowIdRef.current = null
        }, 2000)
      }, 10000)
    },
    [clearTimers],
  )

  const hitRing = useCallback(
    (x: number, y: number) => {
      const { w, h } = sizeRef.current
      if (w <= 0 || h <= 0) return
      const layout = getRingLayout(w, h)
      const fc = frameCountRef.current
      for (const ring of layout) {
        const sway = Math.sin(fc * 0.015 + ring.offset) * SWAY_AMP
        const cy = ring.cy + sway
        const dx = (x - ring.cx) / RING_RX
        const dy = (y - cy) / RING_RY
        if (dx * dx + dy * dy <= 1.15) {
          showMessage(ring, ring.cx, cy)
          return
        }
      }
    },
    [getRingLayout, showMessage],
  )

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    let lastTick = 0

    const applySize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return false
      const prev = sizeRef.current
      if (prev.w === w && prev.h === h) return true
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { w, h }
      starsRef.current = createBgStars(w, h)
      return true
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      applySize(rect.width, rect.height)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const drawRing = (
      cx: number,
      cy: number,
      glowing: boolean,
    ) => {
      if (glowing) {
        ctx.save()
        ctx.shadowColor = 'rgba(125, 211, 252, 0.8)'
        ctx.shadowBlur = 18
      }

      for (let i = 0; i < 5; i++) {
        const t = i / 4
        const rx = RING_RX - i * 2.5
        const ry = RING_RY - i * 1.5
        const grad = ctx.createRadialGradient(cx, cy, rx * 0.3, cx, cy, rx)
        grad.addColorStop(0, `rgba(224, 242, 254, ${0.35 + t * 0.25})`)
        grad.addColorStop(0.5, `rgba(125, 211, 252, ${0.5 + t * 0.2})`)
        grad.addColorStop(1, 'rgba(125, 211, 252, 0.15)')
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.2 + (glowing ? 0.8 : 0)
        ctx.stroke()
      }

      const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, RING_RX * 0.55)
      inner.addColorStop(0, 'rgba(224, 242, 254, 0.12)')
      inner.addColorStop(1, 'rgba(125, 211, 252, 0)')
      ctx.fillStyle = inner
      ctx.beginPath()
      ctx.ellipse(cx, cy, RING_RX * 0.55, RING_RY * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()

      if (glowing) ctx.restore()
    }

    const draw = (now: number) => {
      if (!running) return
      frameRef.current = requestAnimationFrame(draw)

      if (now - lastTick < FRAME_MS) return
      lastTick = now
      frameCountRef.current++

      const { w, h } = sizeRef.current
      if (w <= 0 || h <= 0) return

      ctx.clearRect(0, 0, w, h)

      for (const s of starsRef.current) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`
        ctx.fill()
      }

      const fc = frameCountRef.current
      const layout = getRingLayout(w, h)
      for (const ring of layout) {
        const sway = Math.sin(fc * 0.015 + ring.offset) * SWAY_AMP
        const cy = ring.cy + sway
        drawRing(ring.cx, cy, glowIdRef.current === ring.id)
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.y += p.vy
        p.opacity -= 0.002
        if (p.opacity <= 0) return false
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240, 248, 255, ${p.opacity})`
        ctx.fill()
        return true
      })
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      running = false
      observer.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [getRingLayout])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (!fading) return
    const start = performance.now()
    let id = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 2000)
      setMessageOpacity(1 - t)
      if (t < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [fading, activeMessage])

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.back-link, .stay-message')) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    hitRing(e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <div className="screen stay-screen" onPointerDown={handlePointer}>
      <div className="mist-layer">
        <MistCanvas particleCount={50} />
      </div>
      <div ref={containerRef} className="stay-canvas-wrap">
        <canvas ref={canvasRef} className="stay-canvas" />
      </div>
      <p className="stay-hint">触れてみて</p>
      {activeMessage && (
        <p
          className="stay-message"
          style={{ opacity: messageOpacity }}
        >
          {activeMessage}
        </p>
      )}
      <button
        type="button"
        className="back-link"
        onClick={(e) => {
          e.stopPropagation()
          onBack()
        }}
      >
        もどる
      </button>
    </div>
  )
}
