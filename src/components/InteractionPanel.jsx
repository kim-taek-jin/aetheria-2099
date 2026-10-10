import { useRef, useState } from 'react'
import { Send, MessageSquare, Ghost, Flame, Search, Terminal, EyeOff, Footprints, FileSearch, Sparkles, Lock } from 'lucide-react'
import { useT } from '../i18n/index.js'

// 각 톤의 아이콘·색 + "판돈" 태그(위험/보상을 한눈에 — 선택에 무게를 준다).
const TONE_STYLE = {
  // dialogue
  Honest: { icon: MessageSquare, cls: 'border-neon-green/40 text-neon-green hover:bg-neon-green/10', stake: 'stakeHonest', risk: 0 },
  Deceptive: { icon: Ghost, cls: 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10', stake: 'stakeDeceptive', risk: 0 },
  Aggressive: { icon: Flame, cls: 'border-neon-red/40 text-neon-red hover:bg-neon-red/10', stake: 'stakeAggressive', risk: 2 },
  // action
  Investigate: { icon: Search, cls: 'border-neon-amber/40 text-neon-amber hover:bg-neon-amber/10', stake: 'stakeInvestigate', risk: 0 },
  Hack: { icon: Terminal, cls: 'border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/10', stake: 'stakeHack', risk: 2 },
  Stealth: { icon: EyeOff, cls: 'border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10', stake: 'stakeStealth', risk: -1 },
  Flee: { icon: Footprints, cls: 'border-neon-amber/40 text-neon-amber hover:bg-neon-amber/10', stake: 'stakeFlee', risk: -1 },
}

// 잔향(지난 판의 기억으로 열린 선택지) — 다른 색, 한 줄 전체. 눈에 띄어야 한다:
// "다시 하니까 이게 열렸다"는 감각이 이 시스템의 보상 전부다.
const RESIDUE_STYLE = {
  icon: Sparkles,
  cls: 'border-neon-amber/60 bg-neon-amber/5 text-neon-amber hover:bg-neon-amber/15 sm:col-span-3',
  stake: 'residueStake',
  risk: 0,
}

// 체험판에서 잠긴 길 — 숨기지 않는다. 보이지만 갈 수 없다는 것이 정식판으로 가는 이유다.
const LOCKED_STYLE = {
  icon: Lock,
  cls: 'border-white/15 text-cyan-200/40 hover:border-neon-amber/50 hover:text-neon-amber/80',
  stake: 'lockedStake',
  risk: 0,
}

export default function InteractionPanel({ choices, onChoose, onFreeText, onPresentEvidence, fragmentCount = 0, disabled, firstWord = false, onSkipFirstWord }) {
  const t = useT()
  const [text, setText] = useState('')
  // 한글 IME 조합 상태. keydown 시점엔 마지막 글자가 아직 조합 중이라
  // Enter가 "조합 확정"으로 소비되고 전송이 무시된다(= Enter를 두 번 눌러야 함).
  // 조합이 끝난 뒤인 keyup에서 보내야 한 번에 전송된다.
  const composing = useRef(false)

  function submitFree() {
    const v = text.trim()
    if (!v || disabled) return
    onFreeText(v)
    setText('')
  }

  return (
    <div className="panel-border rounded-lg p-3">
      {/* 첫 입력 — 이 게임에서 "어, 이건 다르네"를 만드는 건 자유 입력뿐인데,
          선택지 세 개 아래 입력칸으로 두면 처음 온 사람은 버튼만 누르다 나간다.
          그래서 첫 턴에는 선택지를 잠깐 치우고 직접 한 마디 하게 한다.
          누르면 바로 선택지로 넘어갈 수 있다 — 막지는 않는다. */}
      {firstWord && (
        <div className="intro-up mb-3 rounded border border-neon-cyan/40 bg-neon-cyan/[0.05] px-3 py-3 text-center">
          <div className="text-[11px] font-bold tracking-widest text-neon-cyan">{t('firstWordTitle')}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-cyan-200/60">{t('firstWordSub')}</div>
        </div>
      )}
      <div className={`mb-3 grid gap-2 sm:grid-cols-3 ${firstWord ? 'hidden' : ''}`}>
        {(choices || []).map((c, i) => {
          const s = c.locked ? LOCKED_STYLE : c.residue ? RESIDUE_STYLE : TONE_STYLE[c.tone] || TONE_STYLE.Honest
          const Icon = s.icon
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChoose(c)}
              className={`neon-btn rounded border px-3 py-2 text-left text-xs leading-snug ${s.cls} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span className="mb-1 flex items-center gap-1">
                <Icon size={11} className="opacity-70" />
                <span className="opacity-70">{c.locked ? t('lockedTone') : c.residue ? t('residueTone') : c.tone}</span>
                {/* 판돈 태그: 위험은 붉게, 잠행/이탈은 시안으로 — 선택의 무게를 노출 */}
                <span
                  className={`ml-auto rounded px-1 text-[9px] font-bold tracking-wider ${
                    c.locked
                      ? 'bg-neon-amber/10 text-neon-amber/70'
                      : s.risk > 0 ? 'bg-neon-red/15 text-neon-red' : s.risk < 0 ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/5 text-cyan-300/50'
                  }`}
                >
                  {t(s.stake)}
                </span>
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
          hidden={firstWord}
          title={fragmentCount === 0 ? t('evidenceNone') : t('evidenceTitle')}
          className="neon-btn flex shrink-0 items-center gap-1 rounded border border-neon-green/40 bg-neon-green/5 px-3 text-xs text-neon-green disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FileSearch size={14} /> {t('evidence')} {fragmentCount > 0 && `(${fragmentCount})`}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={() => {
            composing.current = false
          }}
          onKeyUp={(e) => {
            // keydown이 아니라 keyup에서 보낸다 — 그 사이에 IME 조합이 끝나므로
            // 한글도 Enter 한 번에 전송된다.
            if (e.key === 'Enter' && !composing.current) submitFree()
          }}
          disabled={disabled}
          autoFocus={firstWord}
          placeholder={firstWord ? t('firstWordPlaceholder') : t('freePlaceholder')}
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

      {firstWord && (
        <button
          onClick={onSkipFirstWord}
          className="mt-2 w-full text-center text-[10px] tracking-widest text-cyan-300/40 hover:text-neon-cyan"
        >
          {t('firstWordSkip')}
        </button>
      )}
    </div>
  )
}
