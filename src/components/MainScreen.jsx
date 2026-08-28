import { useEffect, useRef, useState } from 'react'
import { blip } from '../audio/sound.js'

const NPC_COLOR = {
  Ren: 'text-neon-amber',
  Kael: 'text-neon-cyan',
  Echo: 'text-neon-magenta',
  NEXUS: 'text-neon-green',
}

// Typing-effect dialogue with glitch intensity driven by background tone.
// streaming(있을 때): 로컬 모델이 생성하는 부분 텍스트 — 토큰이 자라는 것 자체가
// 타이핑이라, 인터벌 타이핑을 건너뛰고 받은 만큼 바로 보여준다(대기 체감↓).
export default function MainScreen({ beat, glitch, loading, streaming }) {
  const [shown, setShown] = useState('')
  const scrollRef = useRef(null)
  const streamingLive = !!(streaming && (streaming.narration || streaming.npc_response))
  const full = beat?.npc_response || ''

  // 대사가 나레이션과 동시에 타이핑되면, 나레이션을 읽는 사이에 대사가 이미
  // 끝나 있다. 나레이션 분량에 비례해 대사 시작을 늦춰 "읽고 → 듣는" 순서를 만든다.
  // (손으로 쓴 씬은 생성 대기가 0이라, 이 호흡을 안 주면 전부 한꺼번에 튀어나온다.)
  const narrationLen = (beat?.narration || '').length
  useEffect(() => {
    if (streamingLive) return // 스트리밍 중엔 인터벌 타이핑을 쓰지 않음
    setShown('')
    if (!full) return
    let id = null
    // 나레이션 한 글자당 6ms, 최소 0.35초 최대 2.2초.
    const lead = Math.min(2200, Math.max(350, narrationLen * 6))
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
  }, [full, streamingLive, narrationLen])

  // 스트리밍 중이면 부분 텍스트를, 아니면 확정 비트를 표시.
  const view = streamingLive ? streaming : beat
  const narration = view?.narration
  const npcName = view?.npc_name
  const npcResponse = view?.npc_response || ''
  const dialogueText = streamingLive ? npcResponse : shown
  const typingCursor = streamingLive ? loading : shown.length < full.length
  const isGlitch = beat?.background_tone === 'Forest_Glitch'

  return (
    <div
      ref={scrollRef}
      className="panel-border relative flex-1 overflow-y-auto rounded-lg p-5"
      style={{ '--glitch': isGlitch ? 0.9 : glitch }}
    >
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
              <p key={i} className="beat-para" style={{ animationDelay: `${i * 180}ms` }}>
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
