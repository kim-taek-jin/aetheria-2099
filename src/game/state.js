// ============================================================
//  State machine + versioned save schema.
//
//  Design decisions from the architecture review:
//   1) Per-NPC relationship gauges (not a single global pair) so
//      choices can create trade-offs (help Echo -> Kael suspicion up).
//   2) Threshold GATING so numbers actually open/lock story.
//   3) SaveGameV1 with a `version` field + pure serialize/deserialize
//      so LocalStorage (web) and JSON save-file (Electron/Tauri) share
//      the exact same shape. Phase 2 conversion cost ~ 0.
// ============================================================

import { SCENES } from './scenes.js'

export const SAVE_VERSION = 1
export const STORAGE_KEY = 'aetheria2099.save.v1'
export const API_KEY_STORAGE = 'aetheria2099.byok'

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Gating thresholds referenced by UI + prompt hints.
export const GATES = {
  SUSPICION_HOSTILE: 70, // >= : NPC turns on the player / route ejection
  AFFINITY_TRUST: 60, // >= : hidden truths / early chip #00 reveal
}

// 밸런스: 세력 NPC와 우호적 상호작용 시 매 턴 보장되는 최소 호감 상승(모델 신호가 약해도
// 세력 정렬이 실제 보상으로 이어지게). 플레이테스트로 조정.
export const AFFINITY_FLOOR = 6

export function createNewGame() {
  return {
    version: SAVE_VERSION,
    createdAt: null, // stamped by caller (Date.* is avoided in pure code)
    updatedAt: null,
    // Per-NPC gauges.
    relationships: {
      Ren: { suspicion: 10, affinity: 10 },
      Kael: { suspicion: 20, affinity: 5 },
      Echo: { suspicion: 15, affinity: 10 },
      NEXUS: { suspicion: 0, affinity: 0 },
    },
    currentNode: 'PROLOGUE_RAIN_01',
    turnCount: 0, // total player turns this playthrough
    turnsOnNode: 0, // turns spent on the current node (drives pacing)
    // NEXUS trace level (0-100): city-wide surveillance heat. Rises when Jayne
    // is conspicuous, falls when she lies low. 100 = drone raid (capture).
    heat: 0,
    activeNpc: 'NEXUS',
    backgroundTone: 'Danger',
    // Rolling summary — model self-updates this each turn so we never
    // resend the full transcript (token truncation strategy).
    storySummary: '',
    // Only the last N turns are kept verbatim; older turns live in summary.
    recentTurns: [],
    // Codex: unlocked memory fragments (also doubles as Phase 2 gallery data).
    fragments: [],
    usedFragments: [], // evidence already presented (scarcity — impact fades on reuse)
    // World-state flags: discrete story facts the AI has established. Drives
    // continuity + consequence (the narrative engine's memory of "what happened").
    flags: {},
    // 레일 위의 창발: 플레이어가 자유 입력으로 확립한 사실(최근 것들). 소형 모델이
    // set_flags를 잘 안 내므로 클라이언트가 기록해 이후 프롬프트에 canon으로 주입한다.
    playerCanon: [],
    endingReached: null,
    failed: null, // { npc, reason } when a run collapses (arrest / route lost)
  }
}

// Suspicion at/above this = irreversible failure (arrest / route collapse).
export const FAIL_SUSPICION = 100
// NEXUS trace at/above this = drone raid (a second, city-wide failure path).
export const HEAT_MAX = 100
export const HEAT_WARN = 70
// 매 턴 자동으로 오르는 추적량(압박 시계). 잠행(-5)으로 되감을 수 있어 위험/보상 성립.
export const HEAT_TICK = 3

export const MAX_RECENT_TURNS = 6

// Apply a validated AI response object to the save, returning a new save.
export function applyResponse(save, res, playerInput) {
  const next = structuredCloneSafe(save)
  const npc = res.npc_name && next.relationships[res.npc_name] ? res.npc_name : next.activeNpc

  // Primary NPC gauge change (double-clamped defense).
  const rel = next.relationships[npc]
  rel.suspicion = clamp(rel.suspicion + clamp(res.suspicion_change ?? 0, -10, 10), 0, 100)
  // 밸런스(P1): 세력 호감을 "바닥 보장"한다. 모델이 affinity_change를 거의 0으로만 줘서
  // 게이지가 시작값에 머물고 세력 엔딩에 못 닿는 문제 → 세력 NPC와 우호적으로(비공격 +
  // 모델이 호감을 깎지 않음) 상호작용하면 매 턴 최소 +AFFINITY_FLOOR를 보장한다.
  const affRaw = clamp(res.affinity_change ?? 0, -10, 10)
  const isFaction = npc !== 'NEXUS'
  const aggressive = /위협|도발|공격|threat/i.test(playerInput || '')
  let affApplied = affRaw > 0 ? Math.min(12, Math.round(affRaw * 1.6)) : affRaw
  // 진짜 보장: 세력과 비공격 상호작용이면 모델이 호감을 깎아도(음수) 최소 +FLOOR 보장.
  // (적대적 씬에서도 협조 의도가 관계를 쌓게 — 세력 정렬이 실제 보상으로 이어지도록)
  // 증거가 빗나간 턴엔 바닥 보장을 걷는다 — 안 그러면 "실패해도 호감이 오르는"
  // 모순이 생겨 추리의 비용이 사라진다(플레이테스트에서 발견).
  const evidenceMissed = res.evidence_result === 'miss'
  if (isFaction && !aggressive && !evidenceMissed) affApplied = Math.max(affApplied, AFFINITY_FLOOR)
  if (evidenceMissed) affApplied = Math.min(affApplied, 0) // 빗나감은 이득이 될 수 없다
  rel.affinity = clamp(rel.affinity + affApplied, 0, 100)

  // Trade-off ripple: aggressive/deceptive beats nudge rivals.
  applyTradeoff(next, npc, res, playerInput)

  // NEXUS trace: AI's read of how conspicuous this beat was, plus a client
  // baseline from the action type (defense-in-depth so heat moves even if the
  // model forgets). Conspicuous acts raise it; lying low lowers it.
  // 긴장(압박 시계): NEXUS 추적은 매 턴 자동으로 +HEAT_TICK 오른다 — 도시가 늘 감시
  // 중이므로 가만히 있어도 조여온다. 눈에 띄는 행동은 크게 뛰고, 잠행은 되돌린다.
  // 100 = 드론 급습(게임오버). 이게 "매 턴이 risk"인 긴장을 만든다.
  let heatDelta = clamp(res.heat_change ?? 0, -10, 10) + HEAT_TICK
  if (/위협|도발|해킹|hack|폭로|송출/i.test(playerInput || '')) heatDelta += 4
  else if (/은신|도주|stealth|flee|숨/i.test(playerInput || '')) heatDelta -= 5 // 잠행은 시계를 되감음
  next.heat = clamp((next.heat || 0) + heatDelta, 0, 100)

  next.activeNpc = npc
  next.backgroundTone = TONE_OK(res.background_tone) ? res.background_tone : next.backgroundTone

  // Pacing bookkeeping: reset per-node counter when the node changes.
  const nextNode = res.story_branch || next.currentNode
  next.turnCount = (next.turnCount || 0) + 1
  next.turnsOnNode = nextNode === next.currentNode ? (next.turnsOnNode || 0) + 1 : 0
  next.currentNode = nextNode

  if (typeof res.updated_summary === 'string' && res.updated_summary.trim()) {
    next.storySummary = res.updated_summary.trim()
  }
  if (Array.isArray(res.new_fragments)) {
    for (const f of res.new_fragments) {
      if (typeof f === 'string' && f.trim() && !next.fragments.includes(f.trim())) {
        next.fragments.push(f.trim())
      }
    }
  }

  // World-state flags: merge in newly established facts (set once, stay true).
  if (Array.isArray(res.set_flags)) {
    for (const f of res.set_flags) {
      if (typeof f === 'string' && f.trim()) next.flags[f.trim()] = true
    }
  }

  // 조각 획득 보장(클라이언트 권한). 씬 바이블이 revealsFragment로 "이 장면의
  // 진실"을 authoring 해두지만, 획득이 모델의 new_fragments에만 의존하면 소형
  // 모델은 사실상 내주지 않는다 — 자동 플레이테스트 5판/82턴에서 조각 1개.
  // 그 결과 증거 제시(추리)라는 핵심 기믹이 도달 불가능한 콘텐츠가 된다.
  // → 노드를 벗어나는 순간(= 그 장면의 진실을 통과한 순간) 클라이언트가 지급한다.
  if (nextNode !== save.currentNode) {
    // 떠나는 씬의 "진실"을 지급한다.
    const earned = SCENES[save.currentNode]?.revealsFragment
    if (typeof earned === 'string' && earned.trim() && !next.fragments.includes(earned.trim())) {
      next.fragments.push(earned.trim())
    }
    // '빈자리' 조각은 반대로 **진입 시** 지급한다. #4가 엔딩 선택 노드에 있어서,
    // 떠날 때 주면 엔딩 자격 판정(eligibleEndings)이 이미 끝난 뒤라 진엔딩이
    // 영원히 열리지 않는다.
    const gap = SCENES[nextNode]?.gapFragment
    if (typeof gap === 'string' && gap.trim() && !next.fragments.includes(gap.trim())) {
      next.fragments.push(gap.trim())
    }
  }

  // Keep only the last N turns verbatim.
  next.recentTurns.push({
    player: playerInput || '(개시)',
    npc: res.npc_name,
    narration: res.narration || '',
    line: res.npc_response,
  })
  if (next.recentTurns.length > MAX_RECENT_TURNS) {
    next.recentTurns = next.recentTurns.slice(-MAX_RECENT_TURNS)
  }

  if (res.story_branch && res.story_branch.startsWith('ENDING_')) {
    next.endingReached = res.story_branch
  }

  // Cost of failure — two distinct threat vectors:
  //  1) a human faction's suspicion maxing out (route betrayal/arrest)
  //  2) NEXUS's city-wide trace maxing out (drone raid)
  if (!next.endingReached && !next.failed) {
    if (npc !== 'NEXUS' && rel.suspicion >= FAIL_SUSPICION) next.failed = { npc, reason: 'SUSPICION' }
    else if (next.heat >= HEAT_MAX) next.failed = { npc: 'NEXUS', reason: 'TRACE' }
  }
  return next
}

function applyTradeoff(save, npc, res, playerInput) {
  const rivalMap = { Ren: ['Echo'], Echo: ['Kael'], Kael: ['Echo'] }
  const rivals = rivalMap[npc] || []
  const aggressive = /위협|도발|threat/i.test(playerInput || '')
  const gainedAffinity = (res.affinity_change ?? 0) > 0
  for (const r of rivals) {
    if (!save.relationships[r]) continue
    if (gainedAffinity) save.relationships[r].suspicion = clamp(save.relationships[r].suspicion + 3, 0, 100)
    if (aggressive) save.relationships[r].affinity = clamp(save.relationships[r].affinity - 2, 0, 100)
  }
}

// --- gating helpers used by UI + prompt ---
export function gateFlags(save) {
  const a = save.relationships[save.activeNpc] || { suspicion: 0, affinity: 0 }
  return {
    hostile: a.suspicion >= GATES.SUSPICION_HOSTILE,
    trusted: a.affinity >= GATES.AFFINITY_TRUST,
  }
}

// --- persistence (shared by web + desktop) ---
export function serialize(save) {
  return JSON.stringify(save)
}
export function deserialize(json) {
  try {
    const obj = JSON.parse(json)
    if (!obj || obj.version !== SAVE_VERSION) return null // future: migrate()
    return obj
  } catch {
    return null
  }
}

const TONE_SET = new Set(['Normal', 'Danger', 'Melancholy', 'Forest_Glitch'])
const TONE_OK = (t) => TONE_SET.has(t)

function structuredCloneSafe(o) {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o))
}
