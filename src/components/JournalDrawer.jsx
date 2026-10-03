import { ScrollText, X, CircleCheck } from 'lucide-react'
import { useT } from '../i18n/index.js'

// 이야기 일지 — surfaces the narrative engine's memory: the rolling summary
// (what happened) + world-state flags (established facts). Makes the systems
// visible to the player and, for a portfolio, legible to a reviewer.
export default function JournalDrawer({ summary, flags, open, onClose }) {
  const t = useT()
  if (!open) return null
  const facts = Object.keys(flags || {})
  const pretty = (f) => f.replace(/_/g, ' ')

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" onClick={onClose}>
      <div className="panel-border h-full w-full max-w-sm overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between text-neon-cyan">
          <span className="flex items-center gap-2 font-bold tracking-widest">
            <ScrollText size={16} /> {t('journalTitle')}
          </span>
          <button onClick={onClose} className="text-cyan-300/60 hover:text-neon-cyan">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-[11px] font-bold tracking-widest text-cyan-300/60">{t('storySoFar')}</h3>
          <p className="whitespace-pre-wrap rounded border border-cyan-500/15 bg-black/40 p-3 text-xs leading-relaxed text-cyan-100">
            {summary?.trim() || t('noStory')}
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-[11px] font-bold tracking-widest text-cyan-300/60">
            {t('facts')} {facts.length > 0 && `(${facts.length})`}
          </h3>
          {facts.length === 0 ? (
            <p className="text-xs text-cyan-300/40">{t('noFacts')}</p>
          ) : (
            <ul className="space-y-1.5">
              {facts.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-neon-green">
                  <CircleCheck size={13} className="shrink-0" />
                  <span className="font-mono text-cyan-100">{pretty(f)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
