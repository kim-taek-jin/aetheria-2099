import { useEffect, useRef, useState } from 'react'
import { blip } from '../audio/sound.js'

const NPC_COLOR = {
  Ren: 'text-neon-amber',
  Kael: 'text-neon-cyan',
  Echo: 'text-neon-magenta',
  NEXUS: 'text-neon-green',
}

// 나레이션도 타이핑할지. 켜면 터미널 감각이 강해지지만, 전환 나레이션이
// 중앙값 274자라 대사까지 합쳐 한 턴에 6초 가까이 "글자 나오는 걸 보는" 시간이
// 생긴다. 그래서 (a) 대사보다 빠른 속도로 치고 (b) 화면을 클릭하면 즉시 전부
// 드러나게 해, 빨리 읽는 사람이 손해 보지 않도록 했다.
const TYPE_NARRATION = true
const NARRATION_MS_PER_STEP = 16 // 한 스텝(3자)당 — 약 5.3ms/자
const NARRATION_CHARS_PER_STEP = 3

// Typing-effect dialogue with glitch intensity driven by background tone.
// streaming(있을 때): 로컬 모델이 생성하는 부분 텍스트 — 토큰이 자라는 것 자체가
// 타이핑이라, 인터벌 타이핑을 건너뛰고 받은 만큼 바로 보여준다(대기 체감↓).
export default function MainScreen({ beat, glitch, loading, streaming }) {
  const [shown, setShown] = useState('')
  const [narrShown, setNarrShown] = useState('') // 나레이션 타이핑 진행분
  const [skipped, setSkipped] = useState(false) // 클릭으로 즉시 표시
  const scrollRef = useRef(null)
  const streamingLive = !!(streaming && (streaming.narration || streaming.npc_response))
  const full = beat?.npc_response || ''

  const fullNarr = beat?.narration || ''

  // 나레이션 타이핑. 스트리밍 중이거나 기능을 끄면 통째로 보여준다.
  useEffect(() => {
    setSkipped(false)
    if (!TYPE_NARRATION || streamingLive) {
      setNarrShown(fullNarr)
      return
    }
    setNarrShown('')
    if (!fullNarr) return
    let i = 0
    const id = setInterval(() => {
      i += NARRATION_CHARS_PER_STEP
      setNarrShown(fullNarr.slice(0, i))
      if (i >= fullNarr.length) clearInterval(id)
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, NARRATION_MS_PER_STEP)
    return () => clearInterval(id)
  }, [fullNarr, streamingLive])

  const narrDone = !TYPE_NARRATION || skipped || streamingLive || narrShown.length >= fullNarr.length

  // 대사는 나레이션이 끝난 뒤에 시작한다 — "읽고 → 듣는" 순서.
  // (나레이션을 타이핑하지 않을 때는 분량에 비례한 리드 타임으로 대신한다.)
  useEffect(() => {
    if (streamingLive) return // 스트리밍 중엔 인터벌 타이핑을 쓰지 않음
    setShown('')
    if (!full || !narrDone) return
    let id = null
    const lead = TYPE_NARRATION ? 400 : Math.min(2200, Math.max(350, fullNarr.length * 6))
    const startAt = setTimeout(() => {
      let i = 0
      id = setInterval(() => {
        i += 2
        setShown(full.slice(0, i))
        if (i % 6 === 0) blip()
        if (i >= full.length) clearInterval(id)
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }, 18)
    }, lead)
    return () => {
      clearTimeout(startAt)
      if (id) clearInterval(id)
    }
  }, [full, streamingLive, narrDone, fullNarr.length])

  // 클릭하면 진행 중인 타이핑을 건너뛴다(빨리 읽는 사람을 기다리게 하지 않는다).
  function revealAll() {
    if (streamingLive) return
    setSkipped(true)
    setNarrShown(fullNarr)
    setShown(full)
  }

  // 스트리밍 중이면 부분 텍스트를, 아니면 확정 비트를 표시.
  const view = streamingLive ? streaming : beat
  const narration = streamingLive ? view?.narration : skipped ? fullNarr : narrShown
  const npcName = view?.npc_name
  const npcResponse = view?.npc_response || ''
  const dialogueText = streamingLive ? npcResponse : shown
  const typingNow = !streamingLive && (!narrDone || shown.length < full.length)
  const typingCursor = streamingLive ? loading : shown.length < full.length
  const isGlitch = beat?.background_tone === 'Forest_Glitch'

  return (
    <div
      ref={scrollRef}
      onClick={revealAll}
      className="panel-border relative flex-1 overflow-y-auto rounded-lg p-5"
      style={{ '--glitch': isGlitch ? 0.9 : glitch }}
    >
      {/* 타이핑 중엔 "클릭하면 건너뜀"을 알려준다 — 모르면 그냥 기다리게 된다. */}
      {typingNow && (
        <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] tracking-widest text-cyan-300/35">
          클릭 — 전부 표시
        </div>
      )}
      {isGlitch && (
        <div className="pointer-events-none absolute right-3 top-3 text-[10px] tracking-widest text-neon-green glitch-flicker">
          ░ SIGNAL LEAK // 외부 정화 영상 감지 ░
        </div>
      )}

      {/* Narration — situational, no speaker. Dimmer + italic + left rule.
          손으로 쓴 씬은 [내 선택의 결과] → [상대의 반응] → [다음 상황]을 한 beat에
          담으므로, 빈 줄(\n\n)을 실제 문단으로 끊어줘야 벽처럼 뭉치지 않는다. */}
      {narration && (
        <div className="mb-4 space-y-2 border-l-2 border-cyan-500/30 pl-3 text-[13px] italic leading-relaxed text-cyan-300/70">
          {String(narration)
            .split(/\n{2,}/)
            .map((para, i) => (
              // 문단마다 조금씩 늦게 떠올라 눈이 따라갈 길을 만든다.
              <p key={i} className={TYPE_NARRATION ? '' : 'beat-para'} style={TYPE_NARRATION ? undefined : { animationDelay: `${i * 180}ms` }}>
                {para.trim()}
              </p>
            ))}
        </div>
      )}

      {/* Dialogue — only when someone actually speaks. */}
      {npcResponse && (
        <>
          <div className={`mb-2 text-xs font-bold tracking-widest ${NPC_COLOR[npcName] || 'text-neon-cyan'}`}>
            {npcName || 'SYSTEM'} <span className="text-cyan-300/40">// {view?.npc_emotion}</span>
          </div>
          <p
            className={`whitespace-pre-wrap text-[15px] leading-relaxed ${isGlitch ? 'chroma text-neon-green' : 'text-cyan-100'}`}
          >
            {dialogueText}
            {typingCursor && <span className="animate-pulse">▋</span>}
          </p>
        </>
      )}

      {/* 아직 아무 텍스트도 안 왔을 때만 대기 표시(스트리밍 첫 토큰 전). */}
      {loading && !streamingLive && (
        <p className="mt-4 animate-pulse text-xs tracking-widest text-neon-cyan/70">
          ▓ NEXUS 연산 중 · 데이터 스트림 수신 ▓
        </p>
      )}
    </div>
  )
}
