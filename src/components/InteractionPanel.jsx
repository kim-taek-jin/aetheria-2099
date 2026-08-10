import { useState } from 'react'
import { Send, MessageSquare, Ghost, Flame, Search, Terminal, EyeOff, Footprints, FileSearch } from 'lucide-react'

const TONE_STYLE = {
  // dialogue
  Honest: { icon: MessageSquare, cls: 'border-neon-green/40 text-neon-green hover:bg-neon-green/10' },
  Deceptive: { icon: Ghost, cls: 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10' },
  Aggressive: { icon: Flame, cls: 'border-neon-red/40 text-neon-red hover:bg-neon-red/10' },
  // action
  Investigate: { icon: Search, cls: 'border-neon-amber/40 text-neon-amber hover:bg-neon-amber/10' },
  Hack: { icon: Terminal, cls: 'border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/10' },
  Stealth: { icon: EyeOff, cls: 'border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10' },
  Flee: { icon: Footprints, cls: 'border-neon-amber/40 text-neon-amber hover:bg-neon-amber/10' },
}

export default function InteractionPanel({ choices, onChoose, onFreeText, onPresentEvidence, fragmentCount = 0, disabled }) {
  const [text, setText] = useState('')

  function submitFree() {
    const t = text.trim()
    if (!t || disabled) return
    onFreeText(t)
    setText('')
  }

  return (
    <div className="panel-border rounded-lg p-3">
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {(choices || []).map((c, i) => {
          const s = TONE_STYLE[c.tone] || TONE_STYLE.Honest
          const Icon = s.icon
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChoose(c)}
              className={`neon-btn rounded border px-3 py-2 text-left text-xs leading-snug ${s.cls} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span className="mb-1 flex items-center gap-1 opacity-70">
                <Icon size={11} /> {c.tone}
              </span>
              {c.text}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPresentEvidence}
          disabled={disabled || fragmentCount === 0}
          title={fragmentCount === 0 ? '제시할 기억 조각이 없다' : '기억 조각을 증거로 제시'}
          className="neon-btn flex shrink-0 items-center gap-1 rounded border border-neon-green/40 bg-neon-green/5 px-3 text-xs text-neon-green disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FileSearch size={14} /> 증거 {fragmentCount > 0 && `(${fragmentCount})`}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Ignore Enter while a Korean IME composition is in progress —
            // that Enter is confirming the composition, not submitting.
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitFree()
          }}
          disabled={disabled}
          placeholder="자유 입력 // 제인의 대사를 직접 타이핑…"
          className="flex-1 rounded border border-neon-cyan/25 bg-black/50 px-3 py-2 text-sm text-cyan-100 outline-none focus:border-neon-cyan disabled:opacity-40"
        />
        <button
          onClick={submitFree}
          disabled={disabled}
          className="neon-btn rounded border border-neon-cyan/40 bg-neon-cyan/10 px-4 text-neon-cyan disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
