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

  useEffect(() => {
    if (streamingLive) return // 스트리밍 중엔 인터벌 타이핑을 쓰지 않음
    setShown('')
    if (!full) return
    let i = 0
    const id = setInterval(() => {
      i += 2
      setShown(full.slice(0, i))
      if (i % 6 === 0) blip()
      if (i >= full.length) clearInterval(id)
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 18)
    return () => clearInterval(id)
  }, [full, streamingLive])

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

      {/* Narration — situational, no speaker. Dimmer + italic + left rule. */}
      {narration && (
        <p className="mb-4 border-l-2 border-cyan-500/30 pl-3 text-[13px] italic leading-relaxed text-cyan-300/70">
          {narration}
        </p>
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
