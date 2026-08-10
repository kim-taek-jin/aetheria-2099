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

export const SAVE_VERSION = 1
export const STORAGE_KEY = 'aetheria2099.save.v1'
export const API_KEY_STORAGE = 'aetheria2099.byok'

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Gating thresholds referenced by UI + prompt hints.
export const GATES = {
  SUSPICION_HOSTILE: 70, // >= : NPC turns on the player / route ejection
  AFFINITY_TRUST: 60, // >= : hidden truths / early chip #00 reveal
}

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
    endingReached: null,
    failed: null, // { npc, reason } when a run collapses (arrest / route lost)
  }
}

// Suspicion at/above this = irreversible failure (arrest / route collapse).
export const FAIL_SUSPICION = 100
// NEXUS trace at/above this = drone raid (a second, city-wide failure path).
export const HEAT_MAX = 100
export const HEAT_WARN = 70

export const MAX_RECENT_TURNS = 6

// Apply a validated AI response object to the save, returning a new save.
export function applyResponse(save, res, playerInput) {
  const next = structuredCloneSafe(save)
  const npc = res.npc_name && next.relationships[res.npc_name] ? res.npc_name : next.activeNpc

  // Primary NPC gauge change (double-clamped defense).
  const rel = next.relationships[npc]
  rel.suspicion = clamp(rel.suspicion + clamp(res.suspicion_change ?? 0, -10, 10), 0, 100)
  rel.affinity = clamp(rel.affinity + clamp(res.affinity_change ?? 0, -10, 10), 0, 100)

  // Trade-off ripple: aggressive/deceptive beats nudge rivals.
  applyTradeoff(next, npc, res, playerInput)

  // NEXUS trace: AI's read of how conspicuous this beat was, plus a client
  // baseline from the action type (defense-in-depth so heat moves even if the
  // model forgets). Conspicuous acts raise it; lying low lowers it.
  let heatDelta = clamp(res.heat_change ?? 0, -10, 10)
  if (/위협|도발|해킹|hack|폭로|송출/i.test(playerInput || '')) heatDelta += 2
  else if (/은신|도주|stealth|flee|숨/i.test(playerInput || '')) heatDelta -= 2
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
