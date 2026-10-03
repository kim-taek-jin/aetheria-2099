import { Lock, ExternalLink, X } from 'lucide-react'
import { STORE_URL } from '../game/edition.js'
import { useT } from '../i18n/index.js'

// 체험판에서 잠긴 길을 눌렀을 때. 광고가 아니라 "이 길 끝에 무엇이 있는지"를
// 한 줄씩 보여준다 — 무엇을 사는지 알아야 산다.
const WHAT_YOU_GET = [
  ['upsellKael', 'upsellKaelDesc'],
  ['upsellEcho', 'upsellEchoDesc'],
  ['upsellResidue', 'upsellResidueDesc'],
  ['upsellEndings', 'upsellEndingsDesc'],
]

export default function UpsellModal({ reason = 'route', onClose }) {
  const t = useT()
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="panel-border w-full max-w-md rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2 text-neon-amber">
          <Lock size={18} />
          <h2 className="text-base font-bold tracking-widest">{t('upsellTitle')}</h2>
          <button onClick={onClose} className="ml-auto text-cyan-300/50 hover:text-cyan-200" aria-label={t('close')}>
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-cyan-200/70">
          {reason === 'ending' ? t('upsellEnding') : t('upsellRoute')}
        </p>

        <ul className="mb-5 space-y-2">
          {WHAT_YOU_GET.map(([k, v]) => (
            <li key={k} className="text-xs leading-relaxed">
              <span className="font-bold text-neon-amber">◈ {t(k)}</span>
              <span className="text-cyan-200/60"> — {t(v)}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          {STORE_URL ? (
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-btn flex flex-1 items-center justify-center gap-1 rounded border border-neon-amber/60 bg-neon-amber/10 px-4 py-2 text-sm font-bold text-neon-amber"
            >
              {t('upsellBuy')} <ExternalLink size={14} />
            </a>
          ) : (
            <span className="flex flex-1 items-center justify-center rounded border border-neon-amber/30 px-4 py-2 text-sm text-neon-amber/60">
              {t('upsellSoon')}
            </span>
          )}
          <button
            onClick={onClose}
            className="neon-btn rounded border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan"
          >
            {reason === 'ending' ? t('close') : t('backToRen')}
          </button>
        </div>
      </div>
    </div>
  )
}
