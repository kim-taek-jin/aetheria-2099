import { useEffect, useRef } from 'react'

// 한글 자모 코드-레인(캔버스) — 인트로/아웃트로 공용 배경 텍스처.
export default function CodeRain({ className = 'opacity-[0.16]' }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const G = 'アカサタナ0123456789ㄱㄴㄷㄹㅁㅂㅅㅇㅈ가나다라마바사'
    let raf, W, H, cols, drops
    const resize = () => {
      W = cv.width = cv.offsetWidth
      H = cv.height = cv.offsetHeight
      cols = Math.max(1, Math.floor(W / 15))
      drops = Array.from({ length: cols }, () => Math.random() * H)
    }
    resize()
    const draw = () => {
      ctx.fillStyle = 'rgba(3,7,12,0.22)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '13px monospace'
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = Math.random() < 0.06 ? 'rgba(57,255,158,0.5)' : 'rgba(34,227,255,0.26)'
        ctx.fillText(G[(Math.random() * G.length) | 0], i * 15, drops[i])
        drops[i] += 5 + Math.random() * 6
        if (drops[i] > H) drops[i] = Math.random() * -120
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />
}
