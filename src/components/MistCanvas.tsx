import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

export interface MistClear {
  id: number
  x: number
  y: number
  radius: number
  strength: number
}

interface MistCanvasProps {
  particleCount?: number
  clears?: MistClear[]
  interactive?: boolean
  className?: string
  /** 1 = 通常、1/3 = 3倍遅い浮遊 */
  driftScale?: number
}

function createParticles(
  width: number,
  height: number,
  count: number,
  driftScale: number,
): Particle[] {
  if (width <= 0 || height <= 0) return []
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.15 * driftScale,
    vy: ((Math.random() - 0.5) * 0.08 - 0.02) * driftScale,
    radius: Math.random() * 40 + 20,
    opacity: Math.random() * 0.15 + 0.05,
  }))
}

export default function MistCanvas({
  particleCount = 55,
  clears = [],
  interactive = false,
  className = '',
  driftScale = 1,
}: MistCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef(0)
  const clearsRef = useRef(clears)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    clearsRef.current = clears
  }, [clears])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const applySize = (w: number, h: number, resetParticles: boolean) => {
      if (w <= 0 || h <= 0) return false
      const prev = sizeRef.current
      if (prev.w === w && prev.h === h && !resetParticles) return true

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { w, h }

      if (resetParticles || particlesRef.current.length === 0) {
        particlesRef.current = createParticles(w, h, particleCount, driftScale)
      }
      return true
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      applySize(rect.width, rect.height, false)
    }

    resize()

    const observer = new ResizeObserver(() => {
      if (!running) return
      resize()
    })
    observer.observe(container)

    const draw = () => {
      if (!running) return

      const { w, h } = sizeRef.current
      if (w <= 0 || h <= 0) {
        frameRef.current = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -p.radius) p.x = w + p.radius
        if (p.x > w + p.radius) p.x = -p.radius
        if (p.y < -p.radius) p.y = h + p.radius
        if (p.y > h + p.radius) p.y = -p.radius

        let alpha = p.opacity

        for (const c of clearsRef.current) {
          const dx = p.x - c.x
          const dy = p.y - c.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < c.radius) {
            const factor = dist / c.radius
            alpha *= factor * (1 - c.strength) + c.strength * 0.05
          }
        }

        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius,
        )
        gradient.addColorStop(0, `rgba(51, 65, 85, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(30, 41, 59, ${alpha * 0.6})`)
        gradient.addColorStop(1, 'rgba(10, 14, 26, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      running = false
      observer.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [particleCount, driftScale])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    </div>
  )
}
