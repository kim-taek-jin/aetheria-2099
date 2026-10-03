import { useEffect, useState } from 'react'
import { RotateCcw, TriangleAlert, ShieldX } from 'lucide-react'
import { useLang, useT, npcName } from '../i18n/index.js'

// Run-collapse screen. Shown when an active faction's suspicion maxes out.
// Deliberately harsh — this is the "cost of failure" that makes choices matter.
export default function FailureScreen({ failed, save, onRestart }) {
  const [stage, setStage] = useState(0)
  const lang = useLang()
  const t = useT()
  const npc = failed?.npc ? npcName(lang, failed.npc) : t('enemy')
  const isTrace = failed?.reason === 'TRACE'

  useEffect(() => {
    const timers = [setTimeout(() => setStage(1), 600), setTimeout(() => setStage(2), 1800)]
    return () => timers.forEach(clearTimeout)
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
          {isTrace ? t('traced') : t('arrested')}
        </h2>

        <p
          className={`mx-auto mb-6 max-w-sm text-sm leading-relaxed text-cyan-100/90 transition-opacity duration-700 ${
            stage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isTrace
            ? t('traceText')
            : t('arrestText', { npc })}
        </p>

        <div
          className={`transition-opacity duration-700 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px] text-neon-amber/80">
            <TriangleAlert size={13} /> {t('lostTrust', { t: save.turnCount || 0 })}
          </div>
          <button
            onClick={onRestart}
            className="neon-btn w-full rounded border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-bold text-neon-cyan"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} /> {t('retry')}
            </span>
          </button>
          <p className="mt-4 text-[10px] tracking-widest text-cyan-300/30">
            {t('retryHint')}
          </p>
        </div>
      </div>
    </div>
  )
}
