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
// 손으로 쓴 서사(authored spine). 있는 씬에서는 AI를 아예 호출하지 않는다 —
// 글이 좋아지고, 덤으로 대기가 0이 된다.
import { hasScript, openingBeat, choiceBeat, nudgeBeat, askBeat, evidenceScriptBeat, SCRIPT } from './game/script.js'
import { resolveIntent, resolveTopic, answerWithModelGated } from './services/intent.js'
import { looksLikeQuestion, TOPICS } from './game/answers.js'
import { SCENES, remainingEstimate, judgeEvidence, weakPointOf, routeChoicesOf, endingChoicesFor } from './game/scenes.js'
import { DEMO_BEATS, nextDemoBeat } from './game/offline.js'
import { IS_DEMO, isLockedNode, markLockedChoices } from './game/edition.js'
import UpsellModal from './components/UpsellModal.jsx'
import { RESIDUES, RESIDUE_FROM, residueChoicesFor, residueBeat, getResidue, recordResidue } from './game/residue.js'
import {
  createNewGame,
  applyResponse,
  serialize,
  deserialize,
  STORAGE_KEY,
  API_KEY_STORAGE,
} from './game/state.js'
import { GATES } from './game/state.js'
import { generateBeat, emergencyBeat, hasGarble } from './services/geminiService.js'
// 자체 파인튜닝 모델(로컬 Ollama). Gemini와 동일 시그니처/반환형이라 배선만 하면 됨.
import { generateBeat as generateBeatLocal, isAvailable as ollamaIsAvailable } from './services/ollamaProvider.js'
import { routeBeat } from './services/aiRouter.js'
import { createPrefetcher } from './services/prefetch.js'
import { enableAudio, setEnabled, isEnabled, setAmbience, glitchBurst, evidenceHit, evidenceMiss, endingSting } from './audio/sound.js'
import { setMusicTone, stopMusic } from './audio/music.js'

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

// 손으로 쓴 씬에서 선택 → 반영 사이의 의도적인 쉼(ms).
// 0이면 클릭과 동시에 화면이 갈아치워져 선택의 무게가 느껴지지 않는다.
const SCRIPT_BEAT_PAUSE_MS = 500

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [showCodex, setShowCodex] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [evidenceMode, setEvidenceMode] = useState(false)
  const [audioOn, setAudioOn] = useState(false)

  const [save, setSave] = useState(() => storage.loadSave() || withStamp(createNewGame()))
  // 비트가 없을 때는 세이브가 있는 씬의 도입부를 쓴다.
  // 프롤로그로 고정하면 진행 중인 세이브를 불러왔을 때 화면과 상태가 어긋난다.
  const [beat, setBeat] = useState(() => {
    const saved = storage.loadBeat()
    if (saved) return saved
    const node = storage.loadSave()?.currentNode || 'PROLOGUE_RAIN_01'
    return openingBeat(node) || openingBeat('PROLOGUE_RAIN_01') || OPENING
  })
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
  // 선생성기 — 플레이어가 읽는 동안 선택지 3개의 다음 비트를 미리 만든다.
  const prefetchRef = useRef(null)
  if (!prefetchRef.current) {
    prefetchRef.current = createPrefetcher(({ save: sv, playerInput, signal }) =>
      generateBeatLocal({ save: sv, playerInput, signal })
    )
  }
  const [ollamaOn, setOllamaOn] = useState(false) // 로컬 자체모델 사용 가능 여부
  const [fellBack, setFellBack] = useState(false) // 이번 턴 클라우드→로컬 폴백 여부
  const [delta, setDelta] = useState(null) // 이번 턴 상태 변화(선택의 무게 연출)
  const [canonMark, setCanonMark] = useState(null) // 플레이어 행동이 세계에 남긴 새 흔적
  // 잔향: 회차를 넘어 남는 기억. 세이브와 분리돼 새 판을 시작해도 유지된다.
  const [residueKnown, setResidueKnown] = useState(() => getResidue())
  const [residueMark, setResidueMark] = useState(null)
  const [upsell, setUpsell] = useState(null) // 체험판: 잠긴 길을 눌렀을 때 'route' | 결말 후 'ending'
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
  // 본편은 전부 손으로 쓴 서사라 AI가 없어도 완주된다. 자유 입력의 의도·주제
  // 판별도 모델이 없으면 키워드 규칙으로 떨어진다. 그래서 "AI 없음"이 곧
  // "플레이 불가"가 아니다 — 이걸 구분하지 않으면 웹에 올렸을 때 방문자가
  // 손으로 쓴 게임 대신 옛 데모를 보게 된다.
  const scriptedHere = hasScript(save.currentNode)
  const playable = scriptedHere || aiReady
  const offlineMode = !playable // 손으로 쓴 씬도 없고 AI도 없을 때만 데모

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

  // Bind ambience + BGM to current background tone. (음악 트랙이 없으면
  // setMusicTone은 조용히 아무것도 하지 않고 절차적 드론만 남는다.)
  useEffect(() => {
    if (audioOn) {
      setAmbience(beat?.background_tone || 'Neutral')
      setMusicTone(beat?.background_tone || 'Neutral')
    }
  }, [beat?.background_tone, audioOn])

  // 루트 분기 노드에서는 authoring 된 선택지를 쓴다(모델 생성분 대신).
  // 게임의 중심 선택이라 모델의 판단에 맡기지 않는다.
  // 잔향 선택지는 손으로 쓴 장면의 평상 선택지 뒤에만 붙는다(분기·결말 노드 제외).
  // 체험판에선 잠긴 루트를 숨기지 않고 자물쇠를 채워 보여준다.
  const fixedChoices = endingChoicesFor(save) || markLockedChoices(routeChoicesOf(save.currentNode))
  const shownChoices =
    fixedChoices ||
    [
      ...(beat?.generated_choices || []),
      ...(hasScript(save.currentNode) ? residueChoicesFor(save.currentNode, residueKnown, save.flags) : []),
    ]

  // 잔향 획득 — 그 진실이 드러나는 장면에 들어선 순간 남는다.
  useEffect(() => {
    const id = RESIDUE_FROM[save.currentNode]
    if (!id) return
    const merged = recordResidue(id)
    setResidueKnown(merged.known)
    if (merged.isNew) {
      setResidueMark(RESIDUES[id])
      const t = setTimeout(() => setResidueMark(null), 6000)
      return () => clearTimeout(t)
    }
  }, [save.currentNode])

  // 선생성: 비트가 확정되면 플레이어가 읽는 동안 선택지 3개의 다음 턴을 미리 만든다.
  // 로컬 모델일 때만 — 클라우드에서 3배로 호출하면 사용자의 유료 쿼터를 3배로 태운다.
  const prefetchKey = `${save.turnCount}:${save.currentNode}`
  useEffect(() => {
    const pf = prefetchRef.current
    const choices = shownChoices
    const canPrefetch =
      usingLocal &&
      !loading &&
      !offlineMode &&
      !hasScript(save.currentNode) && // 손으로 쓴 씬은 생성이 필요 없다
      !save.endingReached &&
      !save.failed &&
      Array.isArray(choices) &&
      choices.length > 0
    if (!canPrefetch) {
      pf.reset()
      return
    }
    pf.start(prefetchKey, choices.map((c) => c.text), { save })
    return () => pf.reset()
    // save 전체가 아니라 서명(prefetchKey)에 반응 — 같은 상태에서 재시작하지 않도록.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchKey, beat, usingLocal, loading, offlineMode, save.endingReached, save.failed])

  // When an ending is reached, let the final line type out, then reveal
  // the ending sequence overlay.
  useEffect(() => {
    if (!save.endingReached) {
      setShowEnding(false)
      return
    }
    const wait = Math.min(6000, 1200 + (beat?.npc_response?.length || 0) * 18)
    const t = setTimeout(() => {
      setShowEnding(true)
      if (audioOn) endingSting() // 결말의 여운 — 화음 패드
    }, wait)
    return () => clearTimeout(t)
  }, [save.endingReached, beat, audioOn])

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
    if (!playable) {
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
    // 선생성 캐시 히트면 생성 없이 즉시 진행(대기 0초). 선택지 클릭에만 해당하고,
    // 자유 입력·증거 제시는 내용을 미리 알 수 없어 항상 새로 만든다.
    // 손으로 쓴 씬의 선택지라면 모델을 부르지 않는다 — 즉시, 그리고 잘 쓰인 글로.
    // 자유 입력을 두 갈래로 받는다 — 이게 "플레이어가 중심"이 되는 지점이다.
    //   묻는 말 → 지금 눈앞의 인물이 자기 관점으로 답한다(씬은 그대로).
    //   하는 말 → 그 의도에 해당하는 장면이 전개된다.
    // 어느 쪽이든 화면에 나가는 글은 손으로 쓴 것이다. 모델은 "무엇을 묻는가/
    // 무엇을 하려는가"를 고르는 일만 한다 — 7B가 실제로 잘하는 일.
    let scripted = meta.fromChoice ? choiceBeat(save.currentNode, playerInput, save.route) : null
    if (!scripted && meta.fromChoice && hasScript(save.currentNode)) {
      const sc = SCRIPT[save.currentNode]
      const r = residueBeat(save.currentNode, playerInput, sc.choices)
      if (r) scripted = { ...r, npc_name: sc.npc, background_tone: sc.tone || 'Normal' }
    }
    if (!scripted && meta.evidenceVerdict && hasScript(save.currentNode)) {
      scripted = evidenceScriptBeat(save.currentNode, meta.evidenceVerdict, save.route)
    }
    if (!scripted && meta.freeform && hasScript(save.currentNode)) {
      const sig = abortRef.current.signal
      const choices = SCRIPT[save.currentNode].choices
      const asking = looksLikeQuestion(playerInput)

      const sc = SCENES[save.currentNode]
      const askModel = (isAction) =>
        usingLocal
          ? answerWithModelGated(
              {
                npc: SCRIPT[save.currentNode].npc,
                voice: sc?.npcVoice,
                setting: sc?.setting,
                question: playerInput,
                isAction,
                signal: sig,
              },
              hasGarble
            )
          : Promise.resolve(null)

      if (asking) {
        // 확신 있는 주제만 손으로 쓴 답을 쓴다. 애매하면 모델에게 맡긴다 —
        // 어설프게 들어맞는 정답지보다 질문에 실제로 반응하는 쪽이 낫다.
        const topic = await resolveTopic({ text: playerInput, topics: TOPICS, signal: sig, useModel: usingLocal })
        const line = topic ? null : await askModel(false)
        scripted = askBeat(save.currentNode, topic, save.route, line, playerInput)
      } else {
        const idx = await resolveIntent({ text: playerInput, choices, signal: sig, useModel: usingLocal })
        if (idx >= 0 && idx < choices.length) {
          scripted = choiceBeat(save.currentNode, choices[idx].text, save.route)
        } else {
          // 예상 못한 행동. 확신 있는 주제면 그 답을, 아니면 모델이 반응한다.
          const topic = await resolveTopic({ text: playerInput, topics: TOPICS, signal: sig, useModel: usingLocal })
          const line = topic ? null : await askModel(true)
          scripted =
            topic || line
              ? askBeat(save.currentNode, topic, save.route, line, playerInput)
              : nudgeBeat(save.currentNode, save.route)
        }
      }
    }

    // 손으로 쓴 결과가 나왔으면 모델을 부르지 않고 그대로 재생한다.
    if (scripted) {
      prefetchRef.current.reset()
      setStreaming(null)
      setFellBack(false)
      // 한 박자 쉼(선택의 무게). 자유 입력은 분류에 이미 시간이 걸리므로 짧게.
      await new Promise((r) => setTimeout(r, meta.fromChoice ? SCRIPT_BEAT_PAUSE_MS : 150))
      applyBeat(scripted, playerInput, meta)
      setLoading(false)
      return
    }

    // 이 턴이 시작되면 상태가 곧 바뀌므로 선생성은 어느 쪽이든 정리한다.
    // (선택지면 고른 것만 남기고 나머지 취소, 자유 입력·증거면 전부 취소 —
    //  안 그러면 남은 선생성이 GPU를 두고 이번 생성과 경쟁해 더 느려진다.)
    const cached = meta.fromChoice ? prefetchRef.current.take(prefetchKey, playerInput) : null
    if (!meta.fromChoice) prefetchRef.current.reset()
    if (cached) {
      const res = await cached.catch(() => null)
      if (res?.ok) {
        setStreaming(null)
        setFellBack(false)
        applyBeat(res.data, playerInput, meta)
        setLoading(false)
        return
      }
      // 선생성이 실패했으면(취소·오류) 조용히 정상 경로로 떨어진다.
    }

    const { res, via } = await routeBeat({
      apiKey: effKey, // 로컬 전용이면 빈 값 → 클라우드 건너뛰고 로컬만
      ollamaOn,
      save,
      playerInput,
      signal: abortRef.current.signal,
      gemini: generateBeat,
      local: generateBeatLocal,
      onPartial: setStreaming,
      freeform: !!meta.freeform, // 자유 입력 행동은 canon으로 각인(레일 위의 창발)
      evidenceVerdict: meta.evidenceVerdict, // 증거 판정은 클라이언트가 확정(모델이 못 뒤집음)
    })
    setFellBack(via === 'local-fallback') // 이 턴에 로컬로 전환됐는지 표시
    setStreaming(null) // 최종 비트로 대체

    const data = res.ok ? res.data : emergencyBeat(save, res.code)
    if (!res.ok && audioOn) glitchBurst()
    applyBeat(data, playerInput, meta)
    setLoading(false)

    // BYOK key rejected -> reopen modal so the player can fix it.
    if (!res.ok && (res.code === 'BAD_KEY' || res.code === 'NO_KEY')) setShowKeyModal(true)
  }

  // 생성된 비트를 상태에 반영하는 공통 경로(정상 생성 / 선생성 캐시 히트 공용).
  function applyBeat(data, playerInput, meta = {}) {
    // 루트 분기는 플레이어의 선택이 최종이다 — 모델이 다른 노드를 골라도 덮어쓴다.
    if (meta.forceBranch) data = { ...data, story_branch: meta.forceBranch }
    // 체험판 잠금 — 클릭뿐 아니라 자유 입력(의도 분류)으로도 잠긴 길에 들어갈 수
    // 있으므로, 상태에 반영하기 직전 한 곳에서 막는다. 턴은 소비되지 않는다.
    if (isLockedNode(data.story_branch)) {
      setUpsell('route')
      return
    }
    if (data.background_tone === 'Forest_Glitch' && audioOn) glitchBurst()
    // Evidence feedback — the payoff / the sting (전용 SFX).
    if (audioOn && data.evidence_result === 'hit') evidenceHit()
    if (audioOn && data.evidence_result === 'miss') evidenceMiss()

    const nextSave = applyResponse(save, data, playerInput)
    // Scarcity: remember evidence already presented, so reuse falls flat.
    if (meta.presentedFragment && !nextSave.usedFragments.includes(meta.presentedFragment)) {
      nextSave.usedFragments = [...nextSave.usedFragments, meta.presentedFragment]
    }
    // 레일 위의 창발: 자유 입력 행동을 canon으로 기록해 이후 프롬프트에 주입(모델이
    // set_flags를 안 내도 플레이어가 만든 것이 지속되게). 최근 6개만 유지.
    if (meta.freeform && playerInput?.trim()) {
      const entry = playerInput.trim().replace(/^\[[^\]]*\]\s*/, '').slice(0, 90)
      nextSave.playerCanon = [...(nextSave.playerCanon || []), entry].slice(-6)
    }
    nextSave.updatedAt = nowIso()
    setSave(nextSave)
    setBeat(data)
    setDelta(computeDelta(save, nextSave, data)) // 선택의 결과를 눈에 보이게
    // 이 턴에 남긴 새 흔적(모델 flag/조각 또는 플레이어 canon)을 표시.
    const newFlags = Object.keys(nextSave.flags || {}).filter((f) => !save.flags?.[f])
    const newFrags = (nextSave.fragments || []).filter((f) => !(save.fragments || []).includes(f))
    const newCanon = (nextSave.playerCanon || []).filter((c) => !(save.playerCanon || []).includes(c))
    if (newFlags.length || newFrags.length || newCanon.length) {
      setCanonMark({ flags: newFlags, frags: newFrags, canon: newCanon })
      setTimeout(() => setCanonMark(null), 4200)
    }
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
    // 정답은 씬이 쥐고 있다 — 모델에 맡기면 판정이 흔들려 추리가 성립하지 않는다.
    const verdict = judgeEvidence(save.currentNode, f, used)
    advance(input, { presentedFragment: f, evidenceVerdict: verdict || undefined })
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
      setMusicTone(beat?.background_tone || 'Neutral')
    } else {
      setEnabled(false)
      setAudioOn(false)
      stopMusic(0.6)
    }
  }

  function resetGame() {
    if (!confirm('진행 상황을 초기화하고 프롤로그로 돌아갑니다. 계속?')) return
    startNewRun()
  }

  function startNewRun() {
    const fresh = withStamp(createNewGame())
    setSave(fresh)
    setBeat(openingBeat('PROLOGUE_RAIN_01') || OPENING)
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
          {IS_DEMO && (
            <span className="ml-2 rounded border border-neon-amber/50 px-1.5 py-0.5 align-middle text-[9px] tracking-widest text-neon-amber">
              체험판
            </span>
          )}
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
            : '🖥 로컬 자체 모델 구동 중 · 오프라인 · 운영비 0 (API 키 불필요)'}
        </div>
      )}

      {/* 키도 로컬 모델도 없는 방문자(= 웹 공개판의 기본 상태). 게임은 온전히
          돌아가므로 경고가 아니라 안내다 — 조용한 한 줄로만 둔다. */}
      {!aiReady && !save.endingReached && !save.failed && (
        <button
          onClick={() => setShowKeyModal(true)}
          className="w-full rounded border border-cyan-500/20 py-1 text-[11px] tracking-widest text-cyan-300/40 transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan"
        >
          🔑 API 키를 넣으면 자유 입력이 더 자유로워집니다 — 준비된 화제 밖의 질문에도 답합니다
        </button>
      )}

      {fellBack && (
        <div className="flex items-center justify-center gap-2 rounded border border-neon-amber/40 bg-neon-amber/10 py-1 text-[11px] tracking-widest text-neon-amber">
          ☁→🖥 클라우드 한도 도달 — 자체 모델로 이어갑니다 (플레이 계속)
        </div>
      )}

      {/* 레일 위의 창발 — 플레이어 행동이 세계에 남긴 새 흔적(canon) 알림 */}
      {residueMark && (
        <div className="intro-up rounded border border-neon-amber/50 bg-neon-amber/10 px-3 py-1.5 text-center text-[11px] text-neon-amber">
          <span className="font-bold tracking-widest">◈ 잔향이 남았다 — {residueMark.label}</span>
          <span className="block text-[10px] text-neon-amber/70">
            이 기억은 다음 판에도 남는다. 다른 길에서 새로운 선택지가 열린다.
          </span>
        </div>
      )}

      {canonMark && (
        <div className="intro-up flex items-center justify-center gap-2 rounded border border-neon-magenta/40 bg-neon-magenta/10 py-1 text-[11px] tracking-widest text-neon-magenta">
          ✎ 세계에 흔적을 남겼다 —{' '}
          {canonMark.frags?.length
            ? canonMark.frags[0].replace(/^기[록억] 조각[·:]?\s*/, '').slice(0, 42)
            : canonMark.canon?.length
            ? canonMark.canon[0].slice(0, 42)
            : canonMark.flags.slice(0, 2).join(' · ')}
          {(canonMark.frags?.length || 0) + (canonMark.flags?.length || 0) + (canonMark.canon?.length || 0) > 1 ? ' …' : ''}
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
        choices={shownChoices}
        disabled={loading || !!save.endingReached || !!save.failed}
        fragmentCount={save.fragments?.length || 0}
        onChoose={(c) =>
          c.locked
            ? setUpsell('route')
            : offlineMode
            ? runDemo(c)
            : advance(c.text, { fromChoice: true, forceBranch: c.branch })
        }
        onFreeText={(t) => (playable ? advance(t, { freeform: true }) : setShowKeyModal(true))}
        onPresentEvidence={() => {
          if (!playable) {
            // 손으로 쓴 씬도 없고 AI도 없을 때만 키를 요구한다.
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

      {upsell && <UpsellModal reason={upsell} onClose={() => setUpsell(null)} />}

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
        weakPoint={weakPointOf(save.currentNode)}
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
          isDemo={IS_DEMO}
          onUpsell={() => setUpsell('ending')}
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
