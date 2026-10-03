import { Lock, ExternalLink, X } from 'lucide-react'
import { STORE_URL } from '../game/edition.js'

// 체험판에서 잠긴 길을 눌렀을 때. 광고가 아니라 "이 길 끝에 무엇이 있는지"를
// 한 줄씩 보여준다 — 무엇을 사는지 알아야 산다.
const WHAT_YOU_GET = [
  ['카엘의 길', '보안국 봉인 서고. 제인의 3년을 지운 결재란에 누구의 서명이 있는가.'],
  ['에코의 길', '송신탑 꼭대기. 깨어나는 대가로 사람들이 잃게 될 것.'],
  ['잔향 2종', '다른 길에서 본 진실이 다음 판에 새 선택지를 연다.'],
  ['결말', '세 세력의 결말과 숨겨진 결말까지 6종 전부.'],
]

export default function UpsellModal({ reason = 'route', onClose }) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="panel-border w-full max-w-md rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2 text-neon-amber">
          <Lock size={18} />
          <h2 className="text-base font-bold tracking-widest">이 길은 정식판에서 이어집니다</h2>
          <button onClick={onClose} className="ml-auto text-cyan-300/50 hover:text-cyan-200" aria-label="닫기">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-cyan-200/70">
          {reason === 'ending'
            ? '체험판에서 걸은 것은 렌의 길 하나입니다. 같은 밤, 다른 두 길에서는 다른 진실이 드러납니다.'
            : '체험판에서는 렌의 길을 끝까지 걸을 수 있습니다. 카엘과 에코의 길은 정식판에 있습니다.'}
        </p>

        <ul className="mb-5 space-y-2">
          {WHAT_YOU_GET.map(([k, v]) => (
            <li key={k} className="text-xs leading-relaxed">
              <span className="font-bold text-neon-amber">◈ {k}</span>
              <span className="text-cyan-200/60"> — {v}</span>
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
              정식판 보기 <ExternalLink size={14} />
            </a>
          ) : (
            <span className="flex flex-1 items-center justify-center rounded border border-neon-amber/30 px-4 py-2 text-sm text-neon-amber/60">
              정식판 곧 공개
            </span>
          )}
          <button
            onClick={onClose}
            className="neon-btn rounded border border-neon-cyan/40 px-4 py-2 text-sm text-neon-cyan"
          >
            {reason === 'ending' ? '닫기' : '렌의 길로'}
          </button>
        </div>
      </div>
    </div>
  )
}
