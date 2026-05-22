import { useCallback, useEffect, useRef, useState } from 'react'
import MistCanvas from './MistCanvas'

type Mode = 'words' | 'shape'

interface PlaceScreenProps {
  onBack: () => void
}

export default function PlaceScreen({ onBack }: PlaceScreenProps) {
  const [mode, setMode] = useState<Mode>('words')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const drawContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0 })
  const [, forceUpdate] = useState(0)

  const canSend =
    mode === 'words' ? text.trim().length > 0 : hasDrawnRef.current

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (mode === 'words') adjustTextareaHeight()
  }, [text, mode, adjustTextareaHeight])

  const initDrawCanvas = useCallback(() => {
    const container = drawContainerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (w <= 0 || h <= 0) return

    const prev = sizeRef.current
    if (prev.w === w && prev.h === h) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    sizeRef.current = { w, h }
    hasDrawnRef.current = false
  }, [])

  useEffect(() => {
    if (mode !== 'shape') return

    const container = drawContainerRef.current
    if (!container) return

    initDrawCanvas()

    let running = true
    const observer = new ResizeObserver(() => {
      if (!running) return
      initDrawCanvas()
    })
    observer.observe(container)

    return () => {
      running = false
      observer.disconnect()
    }
  }, [mode, initDrawCanvas])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (sending) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawingRef.current = true
    canvas.setPointerCapture(e.pointerId)
    const { x, y } = getPoint(e)
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || sending) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      forceUpdate((n) => n + 1)
    }
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const handleSend = () => {
    if (!canSend || sending) return
    setSending(true)
    setTimeout(() => {
      setText('')
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const { w, h } = sizeRef.current
      if (ctx && w > 0 && h > 0) ctx.clearRect(0, 0, w, h)
      hasDrawnRef.current = false
      onBack()
    }, 10000)
  }

  return (
    <div className="screen">
      <div className="mist-layer">
        <MistCanvas particleCount={45} />
      </div>
      <button type="button" className="back-link" onClick={onBack}>
        back
      </button>
      <div className="ui-layer place-layout">
        <div className="mode-toggle place-mode-toggle">
          <button
            type="button"
            className={mode === 'words' ? 'active' : ''}
            onClick={() => setMode('words')}
            disabled={sending}
          >
            言葉で
          </button>
          <button
            type="button"
            className={mode === 'shape' ? 'active' : ''}
            onClick={() => setMode('shape')}
            disabled={sending}
          >
            かたちで
          </button>
        </div>

        <div className="place-center">
          <div
            className={`place-float${sending ? ' place-input-fade sending' : ''}`}
          >
            {mode === 'words' ? (
              <textarea
                ref={textareaRef}
                className="place-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onInput={adjustTextareaHeight}
                disabled={sending}
                rows={1}
              />
            ) : (
              <div ref={drawContainerRef} className="draw-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="draw-canvas"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`send-btn place-send-btn${canSend ? '' : ' send-btn--dim'}`}
          onClick={handleSend}
          disabled={sending}
        >
          霧に送る
        </button>
      </div>
    </div>
  )
}
