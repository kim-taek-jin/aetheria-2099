import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyRound, BookLock, Volume2, VolumeX, RotateCcw, Save, TriangleAlert, ScrollText } from 'lucide-react'

import ApiKeyModal from './components/ApiKeyModal.jsx'
import StatusPanel from './components/StatusPanel.jsx'
import MainScreen from './components/MainScreen.jsx'
import InteractionPanel from './components/InteractionPanel.jsx'
import CodexDrawer from './components/CodexDrawer.jsx'
import JournalDrawer from './components/JournalDrawer.jsx'
import IntroSequence from './components/IntroSequence.jsx'
import EndingScreen from './components/EndingScreen.jsx'
import FailureScreen from './components/FailureScreen.jsx'

import { OPENING } from './game/lore.js'
import { SCENES, remainingEstimate } from './game/scenes.js'
import { DEMO_BEATS, nextDemoBeat } from './game/offline.js'
import {
  createNewGame,
  applyResponse,
  serialize,
  deserialize,
  STORAGE_KEY,
  API_KEY_STORAGE,
} from './game/state.js'
import { GATES } from './game/state.js'
import { generateBeat, emergencyBeat } from './services/geminiService.js'
import { enableAudio, setEnabled, isEnabled, setAmbience, glitchBurst } from './audio/sound.js'

// Persistence abstraction — swap these two fns for a JSON save-file in
// Electron/Tauri (Phase 2) without touching the rest of the app.
const storage = {
  loadSave: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? deserialize(raw) : null
    } catch {
      return null
    }
  },
  writeSave: (save) => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(save))
    } catch {
      /* quota / private mode — ignore */
    }
  },
  loadKey: () => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || ''
    } catch {
      return ''
    }
  },
  writeKey: (k) => {
    try {
      localStorage.setItem(API_KEY_STORAGE, k)
    } catch {
      /* ignore */
    }
  },
}

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [showCodex, setShowCodex] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [evidenceMode, setEvidenceMode] = useState(false)
  const [audioOn, setAudioOn] = useState(false)

  const [save, setSave] = useState(() => storage.loadSave() || withStamp(createNewGame()))
  const [beat, setBeat] = useState(OPENING)
  const [loading, setLoading] = useState(false)
  const [showEnding, setShowEnding] = useState(false)
  const [demoIndex, setDemoIndex] = useState(-1) // -1 = on OPENING; >=0 = DEMO_BEATS index
  // Diegetic boot sequence — plays on first visit only (remembered in storage).
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !localStorage.getItem('aetheria2099.introSeen')
    } catch {
      return true
    }
  })
  const abortRef = useRef(null)

  const offlineMode = !apiKey // no key → scripted demo

  // First mount: load key. No key is fine — the offline demo plays without one.
  useEffect(() => {
    setApiKey(storage.loadKey())
  }, [])

  // Persist on every save change.
  useEffect(() => {
    storage.writeSave(save)
  }, [save])

  // Bind ambience to current background tone.
  useEffect(() => {
    if (audioOn) setAmbience(beat?.background_tone || 'Neutral')
  }, [beat?.background_tone, audioOn])

  // When an ending is reached, let the final line type out, then reveal
  // the ending sequence overlay.
  useEffect(() => {
    if (!save.endingReached) {
      setShowEnding(false)
      return
    }
    const wait = Math.min(6000, 1200 + (beat?.npc_response?.length || 0) * 18)
    const t = setTimeout(() => setShowEnding(true), wait)
    return () => clearTimeout(t)
  }, [save.endingReached, beat])

  const glitch = useMemo(() => {
    // subtle base glitch that rises with the most-suspicious NPC
    const maxSus = Math.max(...Object.values(save.relationships).map((r) => r.suspicion))
    return Math.min(0.6, maxSus / 200)
  }, [save])

  // Danger warning: an active human faction near the arrest threshold.
  const NPC_KO = { Ren: '렌', Kael: '카엘', Echo: '에코' }
  const dangerNpc = useMemo(() => {
    if (save.failed || save.endingReached) return null
    for (const n of ['Ren', 'Kael', 'Echo']) {
      const s = save.relationships[n]?.suspicion ?? 0
      if (s >= GATES.SUSPICION_HOSTILE) return { npc: n, ko: NPC_KO[n], suspicion: s }
    }
    return null
  }, [save])

  async function advance(playerInput, meta = {}) {
    if (loading) return
    if (!apiKey) {
      setShowKeyModal(true)
      return
    }
    setLoading(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const res = await generateBeat({
      apiKey,
      save,
      playerInput,
      signal: abortRef.current.signal,
    })

    const data = res.ok ? res.data : emergencyBeat(save, res.code)
    if (!res.ok && audioOn) glitchBurst()
    if (data.background_tone === 'Forest_Glitch' && audioOn) glitchBurst()
    // Evidence feedback — the payoff / the sting.
    if (data.evidence_result === 'hit' && audioOn) glitchBurst()

    const nextSave = applyResponse(save, data, playerInput)
    // Scarcity: remember evidence already presented, so reuse falls flat.
    if (meta.presentedFragment && !nextSave.usedFragments.includes(meta.presentedFragment)) {
      nextSave.usedFragments = [...nextSave.usedFragments, meta.presentedFragment]
    }
    nextSave.updatedAt = nowIso()
    setSave(nextSave)
    setBeat(data)
    setLoading(false)

    // BYOK key rejected -> reopen modal so the player can fix it.
    if (!res.ok && (res.code === 'BAD_KEY' || res.code === 'NO_KEY')) setShowKeyModal(true)
  }

  // Offline demo: feed pre-authored beats through the same pipeline.
  function runDemo(choice) {
    if (choice?.wall) {
      setShowKeyModal(true)
      return
    }
    if (choice?.restart) {
      startNewRun()
      return
    }
    const data = nextDemoBeat(choice, demoIndex)
    const idx = DEMO_BEATS.indexOf(data)
    if (data.background_tone === 'Forest_Glitch' && audioOn) glitchBurst()
    const nextSave = applyResponse(save, data, '(데모)')
    nextSave.updatedAt = nowIso()
    setSave(nextSave)
    setBeat(data)
    setDemoIndex(idx)
  }

  // Present a memory fragment as evidence. Reuse is dismissed (scarcity).
  function presentEvidence(f) {
    const used = (save.usedFragments || []).includes(f)
    const input = used ? `증거 재제시(이미 보여준 것): "${f}"` : `증거 제시: "${f}"`
    advance(input, { presentedFragment: f })
  }

  function handleSaveKey(k) {
    setApiKey(k)
    storage.writeKey(k)
    setShowKeyModal(false)
  }

  function toggleAudio() {
    if (!audioOn) {
      enableAudio()
      setEnabled(true)
      setAudioOn(true)
      setAmbience(beat?.background_tone || 'Neutral')
    } else {
      setEnabled(false)
      setAudioOn(false)
    }
  }

  function resetGame() {
    if (!confirm('진행 상황을 초기화하고 프롤로그로 돌아갑니다. 계속?')) return
    startNewRun()
  }

  function startNewRun() {
    const fresh = withStamp(createNewGame())
    setSave(fresh)
    setBeat(OPENING)
    setShowEnding(false)
    setDemoIndex(-1)
  }

  return (
    <div className="crt flex h-screen flex-col gap-2 p-2 sm:p-3" style={{ '--glitch': glitch }}>
      {/* ---- Top bar ---- */}
      <header className="flex items-center justify-between px-1">
        <h1 className="text-sm font-extrabold tracking-[0.3em] text-neon-cyan chroma">
          AETHERIA<span className="text-neon-magenta">::</span>2099
        </h1>
        <div className="flex items-center gap-1.5">
          <IconBtn title="사운드" onClick={toggleAudio}>
            {audioOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </IconBtn>
          <IconBtn title="이야기 일지" onClick={() => setShowJournal(true)}>
            <ScrollText size={15} />
          </IconBtn>
          <IconBtn title="기억 조각" onClick={() => setShowCodex(true)}>
            <BookLock size={15} />
          </IconBtn>
          <IconBtn title="API 키" onClick={() => setShowKeyModal(true)}>
            <KeyRound size={15} />
          </IconBtn>
          <IconBtn title="초기화" onClick={resetGame}>
            <RotateCcw size={15} />
          </IconBtn>
        </div>
      </header>

      <StatusPanel save={save} />

      {offlineMode && (
        <button
          onClick={() => setShowKeyModal(true)}
          className="neon-btn flex items-center justify-center gap-2 rounded border border-neon-magenta/40 bg-neon-magenta/10 py-1 text-[11px] tracking-widest text-neon-magenta"
        >
          <KeyRound size={12} /> 오프라인 데모 모드 · 🔑 무료 키를 넣으면 AI 자유 대화 모드로 전환됩니다
        </button>
      )}

      {dangerNpc && (
        <div className="flex items-center justify-center gap-2 rounded border border-neon-red/50 bg-neon-red/10 py-1 text-[11px] font-bold tracking-widest text-neon-red glitch-flicker">
          <TriangleAlert size={13} /> 경고 // {dangerNpc.ko}의 의심 {dangerNpc.suspicion} — 임계 접근. 신중하지 않으면 체포된다.
        </div>
      )}

      <MainScreen beat={beat} glitch={glitch} loading={loading} />

      <InteractionPanel
        choices={beat?.generated_choices}
        disabled={loading || !!save.endingReached || !!save.failed}
        fragmentCount={save.fragments?.length || 0}
        onChoose={(c) => (offlineMode ? runDemo(c) : advance(c.text))}
        onFreeText={(t) => (offlineMode ? setShowKeyModal(true) : advance(t))}
        onPresentEvidence={() => {
          if (offlineMode) {
            // Real evidence judging needs the AI. Nudge to add a key.
            setShowKeyModal(true)
            return
          }
          setEvidenceMode(true)
          setShowCodex(true)
        }}
      />

      <footer className="flex items-center justify-between px-1 text-[10px] text-cyan-300/40">
        <span className="flex items-center gap-1">
          <Save size={10} />
          {SCENES[save.currentNode]
            ? `[${SCENES[save.currentNode].act}] ${SCENES[save.currentNode].title}`
            : save.currentNode}
        </span>
        <span>
          {save.endingReached
            ? `ENDING // ${save.endingReached}`
            : `T${save.turnCount || 0} · 엔딩까지 약 ${remainingEstimate(save.currentNode, save.turnsOnNode).turns}턴 (~${
                remainingEstimate(save.currentNode, save.turnsOnNode).minutes
              }분)`}
        </span>
      </footer>

      {showIntro && (
        <IntroSequence
          onDone={() => {
            setShowIntro(false)
            try {
              localStorage.setItem('aetheria2099.introSeen', '1')
            } catch {
              /* ignore */
            }
          }}
        />
      )}

      {showKeyModal && (
        <ApiKeyModal
          initial={apiKey}
          dismissable={true}
          onSave={handleSaveKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}
      <JournalDrawer
        summary={save.storySummary}
        flags={save.flags}
        open={showJournal}
        onClose={() => setShowJournal(false)}
      />

      <CodexDrawer
        fragments={save.fragments}
        open={showCodex}
        selectMode={evidenceMode}
        onSelect={(f) => {
          setShowCodex(false)
          setEvidenceMode(false)
          presentEvidence(f)
        }}
        onClose={() => {
          setShowCodex(false)
          setEvidenceMode(false)
        }}
      />

      {showEnding && save.endingReached && (
        <EndingScreen
          endingId={save.endingReached}
          beat={beat}
          save={save}
          onRestart={startNewRun}
          onCodex={() => setShowCodex(true)}
        />
      )}

      {save.failed && !save.endingReached && (
        <FailureScreen failed={save.failed} save={save} onRestart={startNewRun} />
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="neon-btn rounded border border-neon-cyan/30 p-1.5 text-neon-cyan/80 hover:text-neon-cyan"
    >
      {children}
    </button>
  )
}

// Date.* is only used at the app boundary (never inside pure game logic).
function nowIso() {
  try {
    return new Date().toISOString()
  } catch {
    return null
  }
}
function withStamp(save) {
  const t = nowIso()
  save.createdAt = t
  save.updatedAt = t
  return save
}
