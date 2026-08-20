import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyRound, BookLock, Volume2, VolumeX, RotateCcw, Save, TriangleAlert, ScrollText, Cpu } from 'lucide-react'

import ApiKeyModal from './components/ApiKeyModal.jsx'
import StatusPanel from './components/StatusPanel.jsx'
import MainScreen from './components/MainScreen.jsx'
import InteractionPanel from './components/InteractionPanel.jsx'
import CodexDrawer from './components/CodexDrawer.jsx'
import JournalDrawer from './components/JournalDrawer.jsx'
import IntroSequence from './components/IntroSequence.jsx'
import TutorialOverlay from './components/TutorialOverlay.jsx'
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
// 자체 파인튜닝 모델(로컬 Ollama). Gemini와 동일 시그니처/반환형이라 배선만 하면 됨.
import { generateBeat as generateBeatLocal, isAvailable as ollamaIsAvailable } from './services/ollamaProvider.js'
import { routeBeat } from './services/aiRouter.js'
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
  // 현재 화면 비트도 저장 — 리로드해도 진행 중이던 씬 텍스트가 살아남게.
  loadBeat: () => {
    try {
      const raw = localStorage.getItem('aetheria2099.beat.v1')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  writeBeat: (beat) => {
    try {
      if (beat) localStorage.setItem('aetheria2099.beat.v1', JSON.stringify(beat))
      else localStorage.removeItem('aetheria2099.beat.v1')
    } catch {
      /* ignore */
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
  const [beat, setBeat] = useState(() => storage.loadBeat() || OPENING)
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(null) // 로컬 생성 중 실시간 부분 텍스트
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
  // 첫 플레이 온보딩(인트로 이후 1회).
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return !localStorage.getItem('aetheria2099.tutorialSeen')
    } catch {
      return true
    }
  })
  const abortRef = useRef(null)
  const [ollamaOn, setOllamaOn] = useState(false) // 로컬 자체모델 사용 가능 여부
  const [fellBack, setFellBack] = useState(false) // 이번 턴 클라우드→로컬 폴백 여부
  const [delta, setDelta] = useState(null) // 이번 턴 상태 변화(선택의 무게 연출)
  // "내 모델 전용" 모드 — 키가 있어도 클라우드를 안 쓰고 로컬만 사용(오프라인·프라이버시).
  const [forceLocal, setForceLocal] = useState(() => {
    try {
      return localStorage.getItem('aetheria2099.forceLocal') === '1'
    } catch {
      return false
    }
  })

  // 프로바이더 결정.
  //  - 로컬 전용(forceLocal): 키를 무시하고 로컬만. 로컬 없으면 AI 불가(데모).
  //  - 그 외: BYOK 키 > 로컬 자체모델 > 스크립트 데모.
  const effKey = forceLocal ? '' : apiKey // 라우팅에 넘길 유효 키(로컬 전용이면 비움)
  const usingLocal = ollamaOn && (forceLocal || !apiKey) // 로컬 모델로 구동 중
  const localWanted = forceLocal && !ollamaOn // 로컬 전용인데 로컬이 없음(안내 필요)
  const aiReady = forceLocal ? ollamaOn : !!apiKey || ollamaOn
  const offlineMode = !aiReady // AI 불가 → 스크립트 데모

  // First mount: load key. No key is fine — local model or offline demo covers it.
  useEffect(() => {
    setApiKey(storage.loadKey())
  }, [])

  // 로컬 Ollama에 자체모델이 떠 있는지 1회 감지(데스크톱/스팀 빌드에서 키 없이 구동).
  useEffect(() => {
    let alive = true
    ollamaIsAvailable()
      .then((ok) => alive && setOllamaOn(ok))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Persist on every save change.
  useEffect(() => {
    storage.writeSave(save)
  }, [save])

  // 현재 비트도 저장 — 리로드 시 진행 중이던 씬이 복원되게(스트리밍 부분값은 제외).
  useEffect(() => {
    if (!loading) storage.writeBeat(beat)
  }, [beat, loading])

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

  // 진행/엔딩 가이드: 지금 어느 세력에 기울었는지 + 결말 분기 임박 여부.
  const guide = useMemo(() => {
    if (save.failed || save.endingReached) return null
    const fac = ['Ren', 'Kael', 'Echo']
    const A = (n) => save.relationships[n]?.affinity ?? 0
    const maxA = Math.max(...fac.map(A))
    const lead = fac.find((n) => A(n) === maxA)
    const nearFinale = !!SCENES[save.currentNode]?.endingChoiceNode
    return { lead: maxA >= 30 ? lead : null, maxA, nearFinale }
  }, [save])

  async function advance(playerInput, meta = {}) {
    if (loading) return
    if (!aiReady) {
      // 로컬 전용인데 로컬이 없으면 키 모달은 도움이 안 됨(안내 배너로 유도).
      if (!forceLocal) setShowKeyModal(true)
      return
    }
    setLoading(true)
    setStreaming(null)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    // 하이브리드 라우팅: 키 있으면 클라우드, 없으면 로컬. 클라우드가 일시적으로
    // 막히면(무료 티어 한도 등) 로컬 자체모델로 자동 전환해 플레이가 끊기지 않게.
    // onPartial: 로컬 생성 중 부분 텍스트를 받아 화면에 흘려보낸다(대기 체감↓).
    const { res, via } = await routeBeat({
      apiKey: effKey, // 로컬 전용이면 빈 값 → 클라우드 건너뛰고 로컬만
      ollamaOn,
      save,
      playerInput,
      signal: abortRef.current.signal,
      gemini: generateBeat,
      local: generateBeatLocal,
      onPartial: setStreaming,
    })
    setFellBack(via === 'local-fallback') // 이 턴에 로컬로 전환됐는지 표시
    setStreaming(null) // 최종 비트로 대체

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
    setDelta(computeDelta(save, nextSave, data)) // 선택의 결과를 눈에 보이게
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
    setDelta(computeDelta(save, nextSave, data))
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

  // "내 모델 전용" 토글 — 켤 때 로컬 가용성을 즉시 재감지(방금 Ollama를 켰을 수 있음).
  function toggleForceLocal() {
    const next = !forceLocal
    setForceLocal(next)
    try {
      localStorage.setItem('aetheria2099.forceLocal', next ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (next) ollamaIsAvailable().then(setOllamaOn).catch(() => {})
  }

  // 로컬 전용인데 Ollama가 꺼져 있던 경우: 모드는 유지한 채 가용성만 다시 감지.
  function recheckLocal() {
    ollamaIsAvailable().then(setOllamaOn).catch(() => {})
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
    storage.writeBeat(null) // 새 게임 — 저장된 비트 제거
    setShowEnding(false)
    setDemoIndex(-1)
    setFellBack(false)
    setDelta(null)
  }

  return (
    <div className="crt flex h-screen flex-col gap-2 p-2 sm:p-3" style={{ '--glitch': glitch }}>
      {/* ---- Top bar ---- */}
      <header className="flex items-center justify-between gap-2 px-1">
        <h1 className="shrink truncate text-xs font-extrabold tracking-[0.12em] text-neon-cyan chroma sm:text-sm sm:tracking-[0.3em]">
          AETHERIA<span className="text-neon-magenta">::</span>2099
        </h1>
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <IconBtn title="사운드" onClick={toggleAudio}>
            {audioOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </IconBtn>
          <button
            title={forceLocal ? '내 모델 전용 모드 (켜짐) — 클라우드 미사용' : '내 모델 전용 모드 (꺼짐)'}
            onClick={toggleForceLocal}
            className={`neon-btn rounded border p-1.5 ${
              forceLocal
                ? 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                : 'border-neon-cyan/30 text-neon-cyan/80 hover:text-neon-cyan'
            }`}
          >
            <Cpu size={15} />
          </button>
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

      <StatusPanel save={save} delta={delta} />

      {guide && (guide.lead || guide.nearFinale) && (
        <div
          className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded border px-2 py-1 text-[10px] tracking-widest ${
            guide.nearFinale
              ? 'border-neon-green/40 bg-neon-green/5 text-neon-green'
              : 'border-cyan-500/15 text-cyan-300/55'
          }`}
        >
          {guide.nearFinale && <span className="font-bold glitch-flicker">◈ 결말 분기 임박</span>}
          <span>{guide.lead ? `▸ 우세 세력: ${NPC_KO[guide.lead]} (호감 ${guide.maxA})` : '▸ 세력 미정'}</span>
          <span className="text-cyan-300/35">· 결말은 관계·추적·기억으로 갈린다</span>
        </div>
      )}

      {offlineMode && !forceLocal && (
        <button
          onClick={() => setShowKeyModal(true)}
          className="neon-btn flex items-center justify-center gap-2 rounded border border-neon-magenta/40 bg-neon-magenta/10 py-1 text-[11px] tracking-widest text-neon-magenta"
        >
          <KeyRound size={12} /> 오프라인 데모 모드 · 🔑 무료 키를 넣으면 AI 자유 대화 모드로 전환됩니다
        </button>
      )}

      {localWanted && (
        <button
          onClick={recheckLocal}
          className="neon-btn flex items-center justify-center gap-2 rounded border border-neon-amber/50 bg-neon-amber/10 py-1 text-[11px] tracking-widest text-neon-amber"
        >
          <Cpu size={12} /> 내 모델 전용 모드 · Ollama 미실행 → 지금은 데모. Ollama 실행 후 여기를 눌러 재감지
        </button>
      )}

      {usingLocal && (
        <div className="flex items-center justify-center gap-2 rounded border border-neon-green/40 bg-neon-green/10 py-1 text-[11px] tracking-widest text-neon-green">
          {forceLocal
            ? '🖥 내 모델 전용 모드 · 로컬 자체 모델로만 구동 · 오프라인 · 운영비 0'
            : '🖥 로컬 자체 모델 구동 중 · 오프라인 · 운영비 0 (API 키 불필요) · 🔑 키를 넣으면 HD(클라우드) 모드'}
        </div>
      )}

      {fellBack && (
        <div className="flex items-center justify-center gap-2 rounded border border-neon-amber/40 bg-neon-amber/10 py-1 text-[11px] tracking-widest text-neon-amber">
          ☁→🖥 클라우드 한도 도달 — 자체 모델로 이어갑니다 (플레이 계속)
        </div>
      )}

      {/* 증거 제시 결과 — 코어 메커닉의 페이오프/스팅을 화면 전체로 각인 */}
      {delta && (delta.evidence === 'hit' || delta.evidence === 'miss') && (
        <div
          key={`ev-${delta.turn}`}
          className="evidence-flash pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div
            className={`rounded-lg border px-8 py-4 text-2xl font-extrabold tracking-[0.3em] ${
              delta.evidence === 'hit'
                ? 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                : 'border-neon-red/60 bg-neon-red/10 text-neon-red'
            }`}
          >
            {delta.evidence === 'hit' ? '◆ 증거 적중 ◆' : '✕ 빗나감 ✕'}
          </div>
        </div>
      )}

      {dangerNpc && (
        <div className="flex items-center justify-center gap-2 rounded border border-neon-red/50 bg-neon-red/10 py-1 text-[11px] font-bold tracking-widest text-neon-red glitch-flicker">
          <TriangleAlert size={13} /> 경고 // {dangerNpc.ko}의 의심 {dangerNpc.suspicion} — 임계 접근. 신중하지 않으면 체포된다.
        </div>
      )}

      <MainScreen beat={beat} glitch={glitch} loading={loading} streaming={streaming} />

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

      {!showIntro && showTutorial && (
        <TutorialOverlay
          onClose={() => {
            setShowTutorial(false)
            try {
              localStorage.setItem('aetheria2099.tutorialSeen', '1')
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

// 이번 턴의 상태 변화를 계산(활성 NPC의 의심/호감 + 전역 추적 + 증거 결과).
function computeDelta(prev, next, data) {
  const npc = data.npc_name && next.relationships[data.npc_name] ? data.npc_name : next.activeNpc
  const p = prev.relationships[npc] || { suspicion: 0, affinity: 0 }
  const c = next.relationships[npc] || { suspicion: 0, affinity: 0 }
  return {
    turn: next.turnCount || 0,
    npc,
    dSus: c.suspicion - p.suspicion,
    dAff: c.affinity - p.affinity,
    dHeat: (next.heat || 0) - (prev.heat || 0),
    evidence: data.evidence_result || 'none',
  }
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
