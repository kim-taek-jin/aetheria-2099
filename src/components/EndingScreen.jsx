import { useEffect, useState } from 'react'
import { RotateCcw, BookLock, Trophy, Clock, Fingerprint } from 'lucide-react'
import { SCENES } from '../game/scenes.js'

// Per-ending visual identity: accent color, sigil, epigraph.
const ENDING_STYLE = {
  ENDING_REN_MONOPOLY: {
    accent: 'text-neon-amber',
    ring: 'border-neon-amber/50',
    glow: 'rgba(255,179,71,0.25)',
    sigil: '⬡',
    epigraph: '자유에도 값이 매겨졌다.',
  },
  ENDING_KAEL_SILENCE: {
    accent: 'text-neon-cyan',
    ring: 'border-neon-cyan/50',
    glow: 'rgba(34,227,255,0.22)',
    sigil: '▤',
    epigraph: '평온한 도시, 봉인된 하늘.',
  },
  ENDING_ECHO_BREAKOUT: {
    accent: 'text-neon-red',
    ring: 'border-neon-red/50',
    glow: 'rgba(255,59,82,0.25)',
    sigil: '✕',
    epigraph: '부서진 요람, 첫 숨의 대가.',
  },
  ENDING_NEXUS_TRUST: {
    accent: 'text-neon-green',
    ring: 'border-neon-green/50',
    glow: 'rgba(57,255,158,0.28)',
    sigil: '❋',
    epigraph: '가두지 않기로 했다. 믿기로 했다.',
  },
  ENDING_JAYNE_ORIGIN: {
    accent: 'text-neon-green',
    ring: 'border-neon-green/50',
    glow: 'rgba(57,255,158,0.30)',
    sigil: '❖',
    epigraph: '잃었던 이름을, 마침내 되찾았다.',
  },
  ENDING_SOLO_EXIT: {
    accent: 'text-neon-cyan',
    ring: 'border-neon-cyan/50',
    glow: 'rgba(34,227,255,0.22)',
    sigil: '➤',
    epigraph: '누구의 편도 아닌, 나의 길.',
  },
}

// Cinematic "jack-out" outro that bookends the intro.
const OUTRO_LINES = ['> 세션 종료 시퀀스 개시…', '> 선택과 대가, 기록 봉인…', '> 결말 데이터 저장 완료.']

// Staged reveal: outro log → 1 sigil+title glitch-in → 2 stats → 3 actions.
export default function EndingScreen({ endingId, beat, save, onRestart, onCodex }) {
  const [stage, setStage] = useState(0)
  const [lines, setLines] = useState([])
  const scene = SCENES[endingId]
  const style = ENDING_STYLE[endingId] || ENDING_STYLE.ENDING_KAEL_SILENCE
  const hidden = endingId === 'ENDING_NEXUS_TRUST' || endingId === 'ENDING_JAYNE_ORIGIN'

  useEffect(() => {
    const timers = []
    OUTRO_LINES.forEach((ln, i) => timers.push(setTimeout(() => setLines((p) => [...p, ln]), 200 + i * 380)))
    timers.push(setTimeout(() => setStage(1), 1500)) // sigil + glitch title
    timers.push(setTimeout(() => setStage(2), 2700)) // stats
    timers.push(setTimeout(() => setStage(3), 3500)) // actions
    return () => timers.forEach(clearTimeout)
  }, [])

  const mins = Math.max(1, Math.round(((save.turnCount || 0) * 40) / 60))
  const topNpc = dominantNpc(save)

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/92 p-4"
      style={{ '--glitch': hidden ? 0.9 : 0.25 }}
    >
      {/* radial ending glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(circle at 50% 35%, ${style.glow} 0%, transparent 55%)` }}
      />

      <div className={`intro-up relative w-full max-w-lg rounded-lg border ${style.ring} bg-panel/80 p-8 text-center`}>
        {/* Jack-out log */}
        <div className="mx-auto mb-5 h-16 max-w-xs text-left font-mono text-[11px] leading-relaxed text-cyan-300/50">
          {lines.map((ln, i) => (
            <div key={i} className="intro-up">
              {ln}
              {i === lines.length - 1 && stage < 1 && <span className="animate-pulse">▋</span>}
            </div>
          ))}
        </div>

        {/* Stage 1: sigil + glitch title (bookends the intro) */}
        {stage >= 1 && (
          <div className="intro-up">
            <div className={`mb-3 text-6xl ${style.accent} ${hidden ? 'glitch-flicker' : ''}`}>{style.sigil}</div>
            {hidden && (
              <div className={`mb-2 text-[10px] tracking-[0.4em] ${style.accent}`}>◆ HIDDEN ENDING UNLOCKED ◆</div>
            )}
            <h2 className={`intro-title chroma mb-1 whitespace-nowrap text-2xl font-extrabold tracking-widest ${style.accent}`}>
              {scene?.title || 'ENDING'}
            </h2>
            <p className="mb-5 text-xs italic tracking-wider text-cyan-200/60">“{style.epigraph}”</p>
            <p className="mx-auto mb-6 max-w-md whitespace-pre-wrap text-sm leading-relaxed text-cyan-100">
              {beat?.npc_response}
            </p>
          </div>
        )}

        {/* Stage 2: run stats */}
        <div
          className={`mb-6 transition-opacity duration-700 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <Stat icon={<Clock size={13} />} label="플레이" value={`${save.turnCount || 0}턴 · ${mins}분`} />
            <Stat
              icon={<Fingerprint size={13} />}
              label="기억 조각"
              value={`${save.fragments?.length || 0}개`}
            />
            <Stat icon={<Trophy size={13} />} label="주요 세력" value={topNpc} />
          </div>
        </div>

        {/* Stage 3: actions */}
        <div
          className={`flex flex-col gap-2 transition-opacity duration-700 sm:flex-row ${
            stage >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={onCodex}
            className="neon-btn flex-1 rounded border border-neon-green/40 px-4 py-2 text-sm text-neon-green"
          >
            <span className="inline-flex items-center gap-1">
              <BookLock size={14} /> 기억 조각 보기 ({save.fragments?.length || 0})
            </span>
          </button>
          <button
            onClick={onRestart}
            className="neon-btn flex-1 rounded border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-bold text-neon-cyan"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} /> 다른 결말 보기
            </span>
          </button>
        </div>

        <p className="mt-5 text-[10px] tracking-widest text-cyan-300/30">
          AETHERIA::2099 — 6개의 결말 중 하나. 다른 세력, 다른 진실이 남아 있다.
        </p>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded border border-cyan-500/15 bg-black/40 px-2 py-2">
      <div className="mb-1 flex items-center justify-center gap-1 text-cyan-300/50">{icon}</div>
      <div className="text-cyan-100">{value}</div>
      <div className="text-[9px] text-cyan-300/40">{label}</div>
    </div>
  )
}

function dominantNpc(save) {
  let best = '—'
  let hi = -1
  for (const n of ['Ren', 'Kael', 'Echo']) {
    const a = save.relationships?.[n]?.affinity ?? 0
    if (a > hi) {
      hi = a
      best = n
    }
  }
  return best
}
