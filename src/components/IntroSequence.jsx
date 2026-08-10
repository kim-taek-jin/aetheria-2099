import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

// Diegetic boot sequence — "jacking into Jayne's broker deck".
// Self-contained full-screen moment (no HUD conflict). Skippable.
// Stages: 0 boot log + link bar → 1 title glitch-in → 2 tagline + prompt.
const BOOT_LINES = [
  '> NEXUS-NET 접속 시도…',
  '> 브로커 덱 v9.2 // 무단 접속 우회 로드',
  '> 기억 암호화 계층 스캔… 3개 감지',
  '> 감정 백업 링크 확인… [경고] 익명 신호 수신',
  '> 잭인 준비 완료.',
]

export default function IntroSequence({ onDone }) {
  const [stage, setStage] = useState(0)
  const [lines, setLines] = useState([])
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)

  // Fade/blur out, then hand off to the game (no hard cut).
  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    setTimeout(() => onDone?.(), 450)
  }

  useEffect(() => {
    const timers = []
    BOOT_LINES.forEach((ln, i) => {
      timers.push(setTimeout(() => setLines((p) => [...p, ln]), 240 + i * 380))
    })
    const bootEnd = 240 + BOOT_LINES.length * 380
    timers.push(setTimeout(() => setStage(1), bootEnd + 500)) // title
    timers.push(setTimeout(() => setStage(2), bootEnd + 1700)) // prompt
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="crt fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-void px-6 transition-all duration-500"
      onClick={finish}
      style={{
        '--glitch': stage >= 1 ? 0.6 : 0.15,
        opacity: exiting ? 0 : 1,
        filter: exiting ? 'blur(6px)' : 'blur(0)',
        transform: exiting ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* boot log + link-stabilise bar */}
      <div className="font-pixel mb-10 w-full max-w-md text-[12px] leading-relaxed text-neon-green/80">
        <div className="h-32">
          {lines.map((ln, i) => (
            <div key={i} className="intro-up">
              {ln}
              {i === lines.length - 1 && stage < 1 && <span className="animate-pulse">▋</span>}
            </div>
          ))}
        </div>
        {lines.length >= BOOT_LINES.length && (
          <div className="intro-up mt-3 flex items-center gap-2 text-[10px] text-neon-cyan/70">
            <span className="shrink-0 tracking-widest">링크 안정화</span>
            <div className="h-1.5 w-full overflow-hidden rounded bg-black/60">
              <div
                className="h-full bg-neon-cyan"
                style={{ width: stage >= 1 ? '100%' : '8%', transition: 'width 1.1s ease' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* title — responsive so it never overflows */}
      {stage >= 1 && (
        <h1
          className="intro-title chroma select-none whitespace-nowrap text-center font-extrabold text-neon-cyan"
          style={{ fontSize: 'clamp(1.6rem, 7.6vw, 4rem)', letterSpacing: '0.16em' }}
        >
          AETHERIA<span className="text-neon-magenta">::</span>2099
        </h1>
      )}

      {/* tagline + enter prompt */}
      {stage >= 2 && (
        <div className="intro-up mt-6 flex flex-col items-center gap-5 px-4 text-center">
          <p className="font-pixel text-[11px] tracking-[0.25em] text-cyan-300/70 sm:text-sm">
            빗속의 유품 — 잊혀진 기억이 문을 두드린다
          </p>
          <button
            onClick={finish}
            className="neon-btn font-pixel flex items-center gap-2 rounded border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2 text-sm font-bold tracking-widest text-neon-cyan"
          >
            <ChevronRight size={16} /> 잭인 (시작)
          </button>
        </div>
      )}

      <span className="font-pixel absolute bottom-5 right-6 text-[10px] tracking-widest text-cyan-300/30">
        아무 곳이나 눌러 건너뛰기 →
      </span>
    </div>
  )
}
