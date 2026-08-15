import { Eye, Heart, Satellite, BookLock } from 'lucide-react'

// 첫 플레이 온보딩 — 게이지/추적/증거 규칙을 짧게 브리핑(1회, localStorage 기억).
export default function TutorialOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="intro-up w-full max-w-md rounded-lg border border-neon-cyan/40 bg-panel/90 p-6">
        <h2 className="mb-1 text-center text-lg font-extrabold tracking-widest text-neon-cyan chroma">
          브리핑 // 생존 규칙
        </h2>
        <p className="mb-4 text-center text-[11px] text-cyan-300/50">
          기억 브로커 제인. 도시의 진실에 다가가되 — 살아남아라.
        </p>

        <ul className="space-y-3 text-[13px] leading-relaxed text-cyan-100/90">
          <li className="flex gap-3">
            <span className="mt-0.5 flex shrink-0 gap-1 text-neon-amber">
              <Eye size={14} />
              <Heart size={14} className="text-neon-green" />
            </span>
            <div>
              <b>관계 게이지</b> — 선택이 상대의 <span className="text-neon-amber">의심</span>·
              <span className="text-neon-green">호감</span>을 바꾼다. 한쪽을 도우면 라이벌이 경계한다
              <span className="text-cyan-300/50"> (트레이드오프)</span>.
            </div>
          </li>
          <li className="flex gap-3">
            <Satellite size={14} className="mt-0.5 shrink-0 text-neon-magenta" />
            <div>
              <b>NEXUS 추적</b> — 해킹·폭로 같은 눈에 띄는 행동은 추적을 올리고, 잠행은 내린다.
              <b className="text-neon-red"> 100이면 드론 급습(체포)</b>.
            </div>
          </li>
          <li className="flex gap-3">
            <BookLock size={14} className="mt-0.5 shrink-0 text-neon-cyan" />
            <div>
              <b>기억 조각 = 증거</b> — 모은 조각을 결정적 순간 제시하면 관계가 크게 흔들린다.
              엉뚱하게 쓰면 역효과.
            </div>
          </li>
        </ul>

        <p className="mt-4 text-center text-[10px] tracking-wider text-cyan-300/40">
          엔딩은 6종 — 관계·추적·기억이 어떤 결말을 열지 정한다.
        </p>

        <button
          onClick={onClose}
          className="neon-btn mt-5 w-full rounded border border-neon-cyan/50 bg-neon-cyan/10 py-2 text-sm font-bold tracking-widest text-neon-cyan"
        >
          접속 시작 ▸
        </button>
      </div>
    </div>
  )
}
