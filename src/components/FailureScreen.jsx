import { useEffect, useState } from 'react'
import { RotateCcw, TriangleAlert, ShieldX } from 'lucide-react'

const NPC_KO = { Ren: '렌', Kael: '카엘', Echo: '에코' }

// Run-collapse screen. Shown when an active faction's suspicion maxes out.
// Deliberately harsh — this is the "cost of failure" that makes choices matter.
export default function FailureScreen({ failed, save, onRestart }) {
  const [stage, setStage] = useState(0)
  const npc = NPC_KO[failed?.npc] || failed?.npc || '적'
  const isTrace = failed?.reason === 'TRACE'

  useEffect(() => {
    const t = [setTimeout(() => setStage(1), 600), setTimeout(() => setStage(2), 1800)]
    return () => t.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95 p-4"
      style={{ '--glitch': 0.8 }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,59,82,0.22) 0%, transparent 55%)' }}
      />
      <div className="relative w-full max-w-md rounded-lg border border-neon-red/50 bg-panel/85 p-8 text-center">
        <div className="mb-3 flex justify-center text-neon-red glitch-flicker">
          <ShieldX size={56} />
        </div>
        <div className="mb-1 text-[10px] tracking-[0.4em] text-neon-red">◆ CONNECTION TERMINATED ◆</div>
        <h2 className="mb-3 text-2xl font-extrabold tracking-widest text-neon-red chroma">
          {isTrace ? '추적 완료' : '체포됨'}
        </h2>

        <p
          className={`mx-auto mb-6 max-w-sm text-sm leading-relaxed text-cyan-100/90 transition-opacity duration-700 ${
            stage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isTrace
            ? 'NEXUS의 추적도가 임계를 넘었다. 하늘을 가른 드론 편대가 제인의 위치를 특정하고, 서치라이트가 골목을 백색으로 태운다. 칩 #00은 회수되고 — 이 밤의 진실은 여기서 끝난다.'
            : `${npc}의 의심이 임계를 넘었다. 신호가 역추적되고, 경비대의 팔이 제인의 어깨를 움켜쥔다. 칩 #00은 회수되고 — 이 밤의 진실은 여기서 끝난다.`}
        </p>

        <div
          className={`transition-opacity duration-700 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px] text-neon-amber/80">
            <TriangleAlert size={13} /> {save.turnCount || 0}턴 만에 신뢰를 잃었다.
          </div>
          <button
            onClick={onRestart}
            className="neon-btn w-full rounded border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-bold text-neon-cyan"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} /> 다시 잠입한다
            </span>
          </button>
          <p className="mt-4 text-[10px] tracking-widest text-cyan-300/30">
            의심은 되돌릴 수 있었다. 다음엔 더 신중하게.
          </p>
        </div>
      </div>
    </div>
  )
}
