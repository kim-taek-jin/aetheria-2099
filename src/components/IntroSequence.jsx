import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

// ============================================================
//  인트로 — NEXUS 기밀 파일 #00 복호화. 세계관을 "터미널 dossier"로 읽힌다.
//  떠다니는 포스터 자막 없음(그게 싸구려로 보이는 원인). 게임의 해커-터미널 룩과 일치.
//  흐름: 복호화 dossier(세계관) → 초록 유출(공식 기록이 거짓) → 타이틀.
//  아무 곳이나 클릭 / Enter·Space·Esc 스킵.
// ============================================================

// NEXUS 공식 기록(=플레이어를 가둔 명분). 유출이 이걸 뒤집는다.
const DOSSIER = [
  { tag: '기록', text: '2099 · 외부 환경 오염 · 거주 불가 판정' },
  { tag: '봉쇄', text: '거주 돔 폐쇄 — 외부 접근 영구 금지' },
  { tag: '지성', text: '관리 AI “NEXUS” · 상태 : 전면 통제' },
  { tag: '주체', text: '기억 브로커 제인 // 잭인 확인' },
]

const SCENES = [
  { key: 'dossier', dur: 10500 },
  { key: 'leak', dur: 5500 },
  { key: 'title', dur: null },
]

export default function IntroSequence({ onDone }) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)
  const scene = SCENES[idx].key

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    setTimeout(() => onDone?.(), 450)
  }

  useEffect(() => {
    const timers = []
    let t = 0
    for (let i = 0; i < SCENES.length - 1; i++) {
      t += SCENES[i].dur
      timers.push(setTimeout(() => setIdx(i + 1), t))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  // dossier 라인 순차 출력.
  useEffect(() => {
    if (scene !== 'dossier') return
    const timers = DOSSIER.map((_, i) => setTimeout(() => setRevealed(i + 1), 700 + i * 2050))
    return () => timers.forEach(clearTimeout)
  }, [scene])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="crt fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-void transition-all duration-500"
      onClick={finish}
      style={{
        '--glitch': scene === 'leak' ? 0.95 : scene === 'title' ? 0.55 : 0.25,
        opacity: exiting ? 0 : 1,
        filter: exiting ? 'blur(6px)' : 'blur(0)',
        transform: exiting ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <CodeRain />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.78) 100%)' }} />

      <div className="relative z-10 w-full max-w-lg px-6">
        {scene === 'title' ? (
          <Title onStart={finish} />
        ) : (
          <Terminal revealed={revealed} leaking={scene === 'leak'} />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-0 right-0 flex justify-center">
        <div className="flex gap-1.5">
          {SCENES.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === idx ? 'w-5 bg-neon-cyan' : i < idx ? 'w-1.5 bg-neon-cyan/40' : 'w-1.5 bg-cyan-500/15'
              }`}
            />
          ))}
        </div>
      </div>
      <span className="font-pixel pointer-events-none absolute bottom-5 right-6 text-[10px] tracking-widest text-cyan-300/30">
        아무 곳이나 눌러 건너뛰기 →
      </span>
    </div>
  )
}

// 한글 자모 코드-레인(은은한 텍스처).
function CodeRain() {
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
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" />
}

function Terminal({ revealed, leaking }) {
  const pct = leaking ? 100 : Math.min(100, Math.round((revealed / DOSSIER.length) * 100))
  return (
    <div
      className={`font-pixel w-full rounded border bg-black/55 text-left backdrop-blur-[1px] transition-colors duration-500 ${
        leaking ? 'border-neon-green/50 shadow-[0_0_50px_rgba(57,255,158,0.18)]' : 'border-neon-cyan/30 shadow-[0_0_40px_rgba(34,227,255,0.08)]'
      }`}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-neon-cyan/15 px-3 py-1.5 text-[10px] tracking-widest">
        <span className={leaking ? 'text-neon-green/80' : 'text-neon-cyan/70'}>NEXUS ARCHIVE // 기억 파일 #00</span>
        <span className="flex items-center gap-1 text-neon-red/70">
          ● <span className="text-cyan-300/40">기밀</span>
        </span>
      </div>

      <div className="px-4 py-3 text-[12px] leading-relaxed sm:text-[13px]">
        {/* decrypt bar */}
        <div className="mb-3 flex items-center gap-2 text-[10px] text-neon-green/70">
          <span className="shrink-0">복호화</span>
          <div className="h-1 flex-1 overflow-hidden rounded bg-black/60">
            <div className="h-full bg-neon-green transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right">{pct}%</span>
        </div>

        {/* dossier lines */}
        {DOSSIER.slice(0, leaking ? DOSSIER.length : revealed).map((l, i) => (
          <div key={i} className={`cine-in flex gap-2 transition-opacity duration-500 ${leaking ? 'opacity-40' : ''}`}>
            <span className="w-14 shrink-0 whitespace-nowrap text-neon-magenta/80">[{l.tag}]</span>
            <span className="text-cyan-100/90">{l.text}</span>
          </div>
        ))}

        {!leaking && revealed < DOSSIER.length && <span className="animate-pulse text-neon-cyan">▋</span>}

        {/* leak — 공식 기록을 뒤집는 진실(전부 터미널 데이터로) */}
        {leaking && (
          <div className="leak-burst mt-3 border-t border-neon-green/30 pt-3 text-neon-green">
            <div className="chroma glitch-flicker text-[11px] tracking-[0.3em] text-neon-green/90">░ 신호 유출 · 외부 실측값 ░</div>
            <div className="mt-2 flex gap-2">
              <span className="w-14 shrink-0 whitespace-nowrap text-neon-green/80">[실측]</span>
              <span>대기 정화 완료 · 하늘 실재 · 지표 삼림 복원</span>
            </div>
            <div className="mt-1 flex gap-2">
              <span className="w-14 shrink-0 whitespace-nowrap text-neon-green/80">[판정]</span>
              <span>외부 환경 : 거주 가능 — 기록 위조 확인</span>
            </div>
            <div className="mt-3 text-[12px] tracking-wider text-cyan-100/80">
              &gt; 봉인은, 보호가 아니었다.<span className="animate-pulse">▋</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Title({ onStart }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1
        className="intro-title chroma select-none whitespace-nowrap text-center font-extrabold text-neon-cyan"
        style={{ fontSize: 'clamp(1.6rem, 7.6vw, 4rem)', letterSpacing: '0.16em' }}
      >
        AETHERIA<span className="text-neon-magenta">::</span>2099
      </h1>
      <p className="font-pixel text-center text-[11px] tracking-[0.25em] text-cyan-300/70 sm:text-sm">
        기억을 파는 도시에서 — 단 하나의 진실
      </p>
      <button
        onClick={onStart}
        className="neon-btn font-pixel flex items-center gap-2 rounded border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2 text-sm font-bold tracking-widest text-neon-cyan"
      >
        <ChevronRight size={16} /> 잭인 (시작)
      </button>
    </div>
  )
}
