import { useEffect, useMemo, useRef, useState } from 'react'
import { blip } from '../audio/sound.js'
import { useT } from '../i18n/index.js'

const NPC_COLOR = {
  Ren: 'text-neon-amber',
  Kael: 'text-neon-cyan',
  Echo: 'text-neon-magenta',
  NEXUS: 'text-neon-green',
}
// 말풍선 테두리/배경 — 인물 색을 그대로 쓰되 아주 옅게.
const NPC_RING = {
  Ren: 'border-neon-amber/60 text-neon-amber',
  Kael: 'border-neon-cyan/60 text-neon-cyan',
  Echo: 'border-neon-magenta/60 text-neon-magenta',
  NEXUS: 'border-neon-green/60 text-neon-green',
}

// 나레이션도 타이핑할지. 켜면 터미널 감각이 강해지지만, 전환 나레이션이
// 중앙값 274자라 대사까지 합쳐 한 턴에 6초 가까이 "글자 나오는 걸 보는" 시간이
// 생긴다. 그래서 (a) 대사보다 빠른 속도로 치고 (b) 화면을 클릭하면 즉시 전부
// 드러나게 해, 빨리 읽는 사람이 손해 보지 않도록 했다.
const TYPE_NARRATION = true
const NARRATION_MS_PER_STEP = 16 // 한 스텝(3자)당 — 약 5.3ms/자
const NARRATION_CHARS_PER_STEP = 3
// 말풍선과 말풍선 사이의 숨. 너무 길면 턴이 늘어지고, 너무 짧으면 한 덩어리로 보인다.
const SEG_GAP_MS = 460

// 한 대사를 말풍선 2~3개로 쪼갠다. 채팅 게임의 핵심 리듬 — 상대가 한 번에
// 쏟아내지 않고 끊어서 말한다. 문장 경계에서만 자르고, 너무 짧은 토막은
// 앞 토막에 도로 붙인다(한 단어짜리 말풍선이 생기면 우스워진다).
const MIN_SEG = 22
const MAX_SEGS = 3
export function splitLine(text) {
  const t = String(text || '').trim()
  if (!t) return []
  // 줄바꿈이 있으면 그게 작가가 의도한 경계다. 없으면 문장부호로 나눈다.
  const raw = t.includes('\n')
    ? t.split(/\n+/)
    : t.split(/(?<=[.!?…"」』\u3002])\s+/)
  const segs = []
  for (const piece of raw.map((x) => x.trim()).filter(Boolean)) {
    const last = segs[segs.length - 1]
    if (last && (last.length < MIN_SEG || piece.length < MIN_SEG)) segs[segs.length - 1] = `${last} ${piece}`
    else segs.push(piece)
  }
  // 너무 잘게 쪼개면 턴이 길어진다. 넘치는 건 마지막 말풍선에 합친다.
  if (segs.length > MAX_SEGS) {
    const head = segs.slice(0, MAX_SEGS - 1)
    head.push(segs.slice(MAX_SEGS - 1).join(' '))
    return head
  }
  return segs
}

// 선택지 문구 앞머리의 [솔직하게] 같은 태그를 분리한다 — 말풍선 위의 작은 라벨로.
function splitTag(text) {
  const m = String(text || '').match(/^\s*\[([^\]]{1,12})\]\s*(.*)$/s)
  return m ? { tag: m[1], body: m[2] } : { tag: null, body: String(text || '') }
}

// 화자 머리 — 이름 첫 글자를 동그라미에 넣는다. 아바타 이미지가 없어도
// "누가 말하는지"가 한눈에 잡힌다.
function Avatar({ npc }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
        NPC_RING[npc] || 'border-neon-cyan/60 text-neon-cyan'
      }`}
    >
      {(npc || '?').slice(0, 1)}
    </span>
  )
}

// 나레이션 — 상황 서술. 말풍선으로 만들지 않는다. 이 게임의 나레이션은
// 중앙값 274자라, 채팅 버블에 넣으면 읽기 리듬이 무너진다.
function Narration({ text }) {
  if (!text) return null
  return (
    <div className="my-3 space-y-2 border-l-2 border-cyan-500/40 pl-3 text-[14px] italic leading-relaxed text-cyan-300/80">
      {String(text)
        .split(/\n{2,}/)
        .map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
    </div>
  )
}

// 제인(플레이어)이 한 말 — 오른쪽. 자기가 무엇을 골랐는지 대화 기록에 남는다.
function PlayerMsg({ text, label }) {
  const { tag, body } = splitTag(text)
  if (!body) return null
  return (
    <div className="mb-3 flex flex-col items-end">
      <div className="mb-0.5 text-[9px] tracking-widest text-cyan-300/40">
        {label}
        {tag && <span className="ml-1 text-neon-cyan/50">· {tag}</span>}
      </div>
      <div className="max-w-[78%] rounded-lg rounded-br-sm border border-neon-cyan/25 bg-neon-cyan/[0.08] px-3 py-2 text-[13px] leading-relaxed text-cyan-100/90">
        {body}
      </div>
    </div>
  )
}

const DOTS = (
  <span className="flex gap-1 py-1.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
        style={{ animation: `typingDot 1.1s ${i * 0.18}s infinite ease-in-out` }}
      />
    ))}
  </span>
)

// 인물이 한 말 — 화자 머리 + 이름, 그리고 맨 글.
//
// 말풍선 상자를 씌워 봤다가 걷어냈다. 이 게임의 가장 큰 자산은 산문인데,
// 대사에 상자가 붙으니 그쪽으로 눈이 쏠려 나레이션이 "말풍선 사이의 틈"으로
// 밀려났다. 세계관과도 어긋난다 — 제인은 메신저를 하는 게 아니라 같은 방에
// 서 있다. 그래서 채팅의 **문법**(누가·언제·무엇을, 내 말이 보임)만 남기고
// 상자는 버린다. 끊어서 도착하는 리듬은 타이핑과 간격이 그대로 전한다.
// 플레이어 말풍선은 상자를 유지한다 — 짧고, 오른쪽에 붙어야 "내 말"로 읽힌다.
function NpcGroup({ npc, emotion, parts = [], typingText, cursor, pending, glitch }) {
  const body = (x, key) => (
    <p
      key={key}
      className={`whitespace-pre-wrap text-[15px] leading-relaxed ${glitch ? 'chroma text-neon-green' : 'text-cyan-100'}`}
    >
      {x}
    </p>
  )
  return (
    <div className="mb-4 flex items-start gap-2">
      <Avatar npc={npc} />
      <div className="min-w-0 flex-1">
        <div className={`mb-1 text-[10px] font-bold tracking-widest ${NPC_COLOR[npc] || 'text-neon-cyan'}`}>
          {npc || 'SYSTEM'}
          {emotion && <span className="ml-1 font-normal text-cyan-300/40">// {emotion}</span>}
        </div>
        <div className="space-y-2">
          {parts.map((x, i) => body(x, i))}
          {pending && <span className={NPC_COLOR[npc] || 'text-neon-cyan'}>{DOTS}</span>}
          {typingText !== undefined &&
            !pending &&
            body(
              <>
                {typingText}
                {cursor && <span className="animate-pulse">▋</span>}
              </>,
              'typing',
            )}
        </div>
      </div>
    </div>
  )
}

// Typing-effect dialogue with glitch intensity driven by background tone.
// streaming(있을 때): 로컬 모델이 생성하는 부분 텍스트 — 토큰이 자라는 것 자체가
// 타이핑이라, 인터벌 타이핑을 건너뛰고 받은 만큼 바로 보여준다(대기 체감↓).
//
// turns: save.recentTurns — 지난 턴이 화면에 남는다. 매 턴 화면을 지우면
// 대화가 아니라 슬라이드가 된다. 올라가서 다시 읽을 수 있어야 대화다.
export default function MainScreen({ beat, glitch, loading, streaming, turns = [] }) {
  const t = useT()
  const [shown, setShown] = useState('')
  const [segIdx, setSegIdx] = useState(0) // 지금 쳐지는 말풍선 번호
  const [narrShown, setNarrShown] = useState('') // 나레이션 타이핑 진행분
  const [skipped, setSkipped] = useState(false) // 클릭으로 즉시 표시
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const streamingLive = !!(streaming && (streaming.narration || streaming.npc_response))
  const full = beat?.npc_response || ''
  const fullNarr = beat?.narration || ''
  // 스트리밍 중에는 쪼개지 않는다 — 토큰이 자라는 중이라 경계를 알 수 없다.
  const segments = useMemo(() => (streamingLive ? [full] : splitLine(full)), [full, streamingLive])

  // 지난 턴 / 이번 턴. 마지막 턴은 지금 타이핑되는 비트와 같은 턴이므로,
  // 거기서는 플레이어가 한 말만 가져오고 본문은 타이핑 상태를 쓴다.
  const past = turns.slice(0, -1)
  const current = turns[turns.length - 1]

  const scrollToEnd = () => bottomRef.current?.scrollIntoView({ block: 'end' })

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
      scrollToEnd()
    }, NARRATION_MS_PER_STEP)
    return () => clearInterval(id)
  }, [fullNarr, streamingLive])

  const narrDone = !TYPE_NARRATION || skipped || streamingLive || narrShown.length >= fullNarr.length

  // 대사는 나레이션이 끝난 뒤에 시작한다 — "읽고 → 듣는" 순서.
  // 그리고 한 번에 쏟아내지 않고 말풍선 단위로 끊어서 온다.
  useEffect(() => {
    if (streamingLive) return // 스트리밍 중엔 인터벌 타이핑을 쓰지 않음
    setShown('')
    setSegIdx(0)
    if (!full || !narrDone) return
    let id = null
    let gap = null
    let seg = 0
    const lead = TYPE_NARRATION ? 400 : Math.min(2200, Math.max(350, fullNarr.length * 6))
    const typeSeg = () => {
      const text = segments[seg] || ''
      let i = 0
      id = setInterval(() => {
        i += 2
        setShown(text.slice(0, i))
        if (i % 6 === 0) blip()
        scrollToEnd()
        if (i >= text.length) {
          clearInterval(id)
          if (seg < segments.length - 1) {
            // 말풍선 사이의 숨 — 여기서 "입력 중" 점이 뜬다.
            gap = setTimeout(() => {
              seg += 1
              setSegIdx(seg)
              setShown('')
              typeSeg()
            }, SEG_GAP_MS)
          }
        }
      }, 18)
    }
    const startAt = setTimeout(typeSeg, lead)
    return () => {
      clearTimeout(startAt)
      clearTimeout(gap)
      if (id) clearInterval(id)
    }
  }, [full, streamingLive, narrDone, fullNarr.length, segments])

  // 새 턴이 오면 항상 맨 아래로. 지난 턴이 쌓여도 지금 말이 보여야 한다.
  useEffect(() => {
    scrollToEnd()
  }, [turns.length, beat])

  // 클릭하면 진행 중인 타이핑을 건너뛴다(빨리 읽는 사람을 기다리게 하지 않는다).
  function revealAll() {
    if (streamingLive) return
    setSkipped(true)
    setNarrShown(fullNarr)
    setSegIdx(segments.length - 1)
    setShown(segments[segments.length - 1] || '')
  }

  // 스트리밍 중이면 부분 텍스트를, 아니면 확정 비트를 표시.
  const view = streamingLive ? streaming : beat
  const narration = streamingLive ? view?.narration : skipped ? fullNarr : narrShown
  const npcName = view?.npc_name
  const npcResponse = view?.npc_response || ''
  const lastSeg = segments[segIdx] || ''
  // 다 친 말풍선들 + 지금 쳐지는 것. 스트리밍 중엔 통째로 하나.
  const doneParts = streamingLive ? [] : segments.slice(0, segIdx)
  const dialogueText = streamingLive ? npcResponse : shown
  const typingNow = !streamingLive && (!narrDone || segIdx < segments.length - 1 || shown.length < lastSeg.length)
  const typingCursor = streamingLive ? loading : shown.length < lastSeg.length
  const isGlitch = beat?.background_tone === 'Forest_Glitch'
  // 아직 한 글자도 안 나온 구간 = "입력 중" 점 세 개.
  const npcTyping = !streamingLive && narrDone && Boolean(full) && shown.length === 0

  return (
    <div
      ref={scrollRef}
      onClick={revealAll}
      className="panel-border relative flex-1 overflow-y-auto rounded-lg p-4 sm:p-5"
      style={{ '--glitch': isGlitch ? 0.9 : glitch }}
    >
      {/* 타이핑 중엔 "클릭하면 건너뜀"을 알려준다 — 모르면 그냥 기다리게 된다. */}
      {typingNow && (
        <div className="pointer-events-none sticky bottom-0 z-10 -mb-1 flex justify-end text-[10px] tracking-widest text-cyan-300/35">
          <span className="rounded bg-panel/80 px-1.5 py-0.5">{t('clickReveal')}</span>
        </div>
      )}
      {isGlitch && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 text-[10px] tracking-widest text-neon-green glitch-flicker">
          {t('signalLeak')}
        </div>
      )}

      {/* ---- 지난 턴: 흐리게 남는다. 올라가면 다시 읽을 수 있다. ---- */}
      {past.length > 0 && (
        <div className="opacity-45 transition-opacity hover:opacity-80">
          {past.map((h, i) => (
            <div key={i}>
              <PlayerMsg text={h.player} label={t('youLabel')} />
              <Narration text={h.narration} />
              {h.line && <NpcGroup npc={h.npc} parts={splitLine(h.line)} />}
            </div>
          ))}
          <div className="my-3 border-t border-dashed border-cyan-500/15" />
        </div>
      )}

      {/* ---- 이번 턴 ---- */}
      {current && <PlayerMsg text={current.player} label={t('youLabel')} />}
      <Narration text={narration} />
      {npcResponse && (
        <NpcGroup
          npc={npcName}
          emotion={view?.npc_emotion}
          parts={doneParts}
          typingText={dialogueText}
          cursor={typingCursor}
          pending={npcTyping}
          glitch={isGlitch}
        />
      )}

      {/* 아직 아무 텍스트도 안 왔을 때만 대기 표시(스트리밍 첫 토큰 전). */}
      {loading && !streamingLive && (
        <p className="mt-4 animate-pulse text-xs tracking-widest text-neon-cyan/70">{t('computing')}</p>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
