import { useLang } from '../i18n/index.js'

// 첫 플레이 온보딩 — 게이지/추적/증거 규칙을 짧게 브리핑(1회, localStorage 기억).
// 문단 안에 강조가 섞여 있어 문구 사전 대신 언어별 JSX로 둔다.
export default function TutorialOverlay({ onClose }) {
  const en = useLang() === 'en'
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="intro-up w-full max-w-md rounded-lg border border-neon-cyan/40 bg-panel/90 p-6">
        <h2 className="mb-1 text-center text-lg font-extrabold tracking-widest text-neon-cyan chroma">
          {en ? 'BRIEFING // RULES TO SURVIVE' : '브리핑 // 생존 규칙'}
        </h2>
        <p className="mb-4 text-center text-[11px] text-cyan-300/50">
          {en
            ? 'Jayne, memory broker. Get close to the truth of this city — and stay alive.'
            : '기억 브로커 제인. 도시의 진실에 다가가되 — 살아남아라.'}
        </p>

        {en ? (
          <ul className="space-y-3 text-[13px] leading-relaxed text-cyan-100/90">
            <li className="rounded border border-neon-cyan/40 bg-neon-cyan/[0.06] p-2">
              <b className="text-neon-cyan">Type freely</b> — this isn't only a choice game. Instead of picking an
              option you can type what Jayne says or does. Ask a question and the character answers in their own voice.
            </li>
            <li>
              <b>Relationship gauges</b> — your choices move each person's{' '}
              <span className="text-neon-amber">suspicion</span> and <span className="text-neon-green">trust</span>. Help one
              side and their rivals get wary<span className="text-cyan-300/50"> (trade-offs)</span>.
            </li>
            <li>
              <b>NEXUS trace</b> — loud moves like hacking or exposing raise the trace; stealth lowers it.
              <b className="text-neon-red"> At 100, the drones come (arrest)</b>.
            </li>
            <li>
              <b>Memory fragments = evidence</b> — present the right fragment at the right moment and a relationship
              shifts hard. Present the wrong one and it backfires.
            </li>
          </ul>
        ) : (
          <ul className="space-y-3 text-[13px] leading-relaxed text-cyan-100/90">
            <li className="rounded border border-neon-cyan/40 bg-neon-cyan/[0.06] p-2">
              <b className="text-neon-cyan">자유 입력</b> — 이 게임은 선택지만 있는 게 아니다. 선택지를 고르는 대신
              제인이 할 말이나 행동을 직접 칠 수 있다. 물으면 인물이 자기 말투로 답한다.
            </li>
            <li>
              <b>관계 게이지</b> — 선택이 상대의 <span className="text-neon-amber">의심</span>·
              <span className="text-neon-green">호감</span>을 바꾼다. 한쪽을 도우면 라이벌이 경계한다
              <span className="text-cyan-300/50"> (트레이드오프)</span>.
            </li>
            <li>
              <b>NEXUS 추적</b> — 해킹·폭로 같은 눈에 띄는 행동은 추적을 올리고, 잠행은 내린다.
              <b className="text-neon-red"> 100이면 드론 급습(체포)</b>.
            </li>
            <li>
              <b>기억 조각 = 증거</b> — 모은 조각을 결정적 순간 제시하면 관계가 크게 흔들린다.
              엉뚱하게 쓰면 역효과.
            </li>
          </ul>
        )}

        <p className="mt-4 text-center text-[10px] tracking-wider text-cyan-300/40">
          {en
            ? 'Six endings — relationships, the trace, and memory decide which ones open.'
            : '엔딩은 6종 — 관계·추적·기억이 어떤 결말을 열지 정한다.'}
        </p>

        <button
          onClick={onClose}
          className="neon-btn mt-5 w-full rounded border border-neon-cyan/50 bg-neon-cyan/10 py-2 text-sm font-bold tracking-widest text-neon-cyan"
        >
          {en ? 'Connect ▸' : '접속 시작 ▸'}
        </button>
      </div>
    </div>
  )
}
