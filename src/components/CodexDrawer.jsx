import { BookLock, Crosshair, X } from 'lucide-react'

// Memory Fragment codex. Doubles as Phase 2 gallery / achievement data,
// serialized inside the same SaveGameV1 object.
export default function CodexDrawer({ fragments, open, onClose, selectMode = false, onSelect, weakPoint }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="panel-border h-full w-full max-w-sm overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between text-neon-green">
          <span className="flex items-center gap-2 font-bold tracking-widest">
            <BookLock size={16} /> {selectMode ? '증거 선택 // 제시할 조각' : '기억 조각 // CODEX'}
          </span>
          <button onClick={onClose} className="text-cyan-300/60 hover:text-neon-cyan">
            <X size={18} />
          </button>
        </div>

        {selectMode && (
          <p className="mb-3 text-xs text-neon-green/70">제시할 기억 조각을 고르면, 제인이 그것을 증거로 들이댄다.</p>
        )}

        {/* 약점 노출 — 이게 있어야 "찍기"가 아니라 "추리"가 된다.
            맞으면 관계가 크게 흔들리고, 빗나가면 의심이 오른다(비용). */}
        {selectMode && weakPoint && (
          <div className="mb-4 rounded border border-neon-amber/40 bg-neon-amber/5 p-3">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold tracking-widest text-neon-amber">
              <Crosshair size={11} /> 읽어낸 약점
            </p>
            <p className="text-xs leading-relaxed text-neon-amber/90">{weakPoint}</p>
            <p className="mt-2 text-[10px] text-cyan-300/50">빗나가면 의심이 오른다. 신중하게.</p>
          </div>
        )}

        {(!fragments || fragments.length === 0) && (
          <p className="text-xs text-cyan-300/50">아직 해금된 기억 조각이 없다. 칩 #00의 진실에 다가가라.</p>
        )}

        <ol className="space-y-3">
          {(fragments || []).map((f, i) => (
            <li
              key={i}
              onClick={selectMode ? () => onSelect?.(f) : undefined}
              className={`rounded border border-neon-green/20 bg-black/40 p-3 text-xs leading-relaxed text-cyan-100 ${
                selectMode ? 'cursor-pointer hover:border-neon-green hover:bg-neon-green/10' : ''
              }`}
            >
              <span className="mb-1 block font-bold text-neon-green">FRAGMENT #{String(i + 1).padStart(2, '0')}</span>
              {f}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
