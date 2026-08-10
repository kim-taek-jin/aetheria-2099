import { useEffect, useRef, useState } from 'react'
import { blip } from '../audio/sound.js'

const NPC_COLOR = {
  Ren: 'text-neon-amber',
  Kael: 'text-neon-cyan',
  Echo: 'text-neon-magenta',
  NEXUS: 'text-neon-green',
}

// Typing-effect dialogue with glitch intensity driven by background tone.
export default function MainScreen({ beat, glitch, loading }) {
  const [shown, setShown] = useState('')
  const scrollRef = useRef(null)
  const full = beat?.npc_response || ''

  useEffect(() => {
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
  }, [full])

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
      {beat?.narration && (
        <p className="mb-4 border-l-2 border-cyan-500/30 pl-3 text-[13px] italic leading-relaxed text-cyan-300/70">
          {beat.narration}
        </p>
      )}

      {/* Dialogue — only when someone actually speaks. */}
      {full && (
        <>
          <div className={`mb-2 text-xs font-bold tracking-widest ${NPC_COLOR[beat?.npc_name] || 'text-neon-cyan'}`}>
            {beat?.npc_name || 'SYSTEM'} <span className="text-cyan-300/40">// {beat?.npc_emotion}</span>
          </div>
          <p
            className={`whitespace-pre-wrap text-[15px] leading-relaxed ${isGlitch ? 'chroma text-neon-green' : 'text-cyan-100'}`}
          >
            {shown}
            {shown.length < full.length && <span className="animate-pulse">▋</span>}
          </p>
        </>
      )}

      {loading && (
        <p className="mt-4 animate-pulse text-xs tracking-widest text-neon-cyan/70">
          ▓ NEXUS 연산 중 · 데이터 스트림 수신 ▓
        </p>
      )}
    </div>
  )
}
