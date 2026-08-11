// ============================================================
//  geminiService.js — the ONLY place that talks to Gemini.
//  Isolated so Phase 2 can swap client-direct calls for a
//  server proxy (rate-limit / key protection) without touching UI.
// ============================================================

import { WORLD_LORE, STORY_NODES, NPCS, EMOTIONS, TONES, CHOICE_TONES, DIALOGUE_TONES, ACTION_TONES } from '../game/lore.js'
import { GATES, gateFlags } from '../game/state.js'
import { sceneAnchor, SCENES, eligibleEndings } from '../game/scenes.js'

// Single source of truth for the model. "gemini-flash-latest" is a rolling
// alias for the current free Flash model — it works across differing keys /
// regions where a pinned id (e.g. gemini-2.5-flash) may 404 for generateContent.
export const MODEL_ID = 'gemini-flash-latest'

// Compact system prompt for the DISTILLED local model. Training and inference
// must use the SAME system string, so it lives here and is imported by both
// the dataset generator and the Ollama provider. (Gemini itself uses the full
// systemInstruction() below; the small model learns the rules into its weights.)
export const SHORT_SYSTEM =
  'You are the narrative ENGINE of the Korean cyberpunk interactive-fiction game "Aetheria 2099". ' +
  'Given the SCENE_ANCHOR, GAME_STATE, and PLAYER_ACTION, output exactly ONE JSON object (no markdown) ' +
  'that advances the story by one beat. All player-facing text must be pure Korean Hangul.'
const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`

// ---- JSON Schema forced on the model (1st line of defense) ----
export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    narration: { type: 'string' }, // 3rd-person situational description (no speaker)
    npc_name: { type: 'string', enum: NPCS },
    npc_response: { type: 'string' },
    npc_emotion: { type: 'string', enum: EMOTIONS },
    suspicion_change: { type: 'integer', minimum: -10, maximum: 10 },
    affinity_change: { type: 'integer', minimum: -10, maximum: 10 },
    heat_change: { type: 'integer', minimum: -10, maximum: 10 }, // NEXUS trace delta (conspicuousness)
    story_branch: { type: 'string', enum: STORY_NODES },
    background_tone: { type: 'string', enum: TONES },
    updated_summary: { type: 'string' }, // self-refreshing rolling memory
    new_fragments: { type: 'array', items: { type: 'string' } },
    set_flags: { type: 'array', items: { type: 'string' } }, // world-state facts established this beat
    evidence_result: { type: 'string', enum: ['none', 'hit', 'miss'] }, // set when player presented evidence
    generated_choices: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          tone: { type: 'string', enum: CHOICE_TONES },
        },
        required: ['text', 'tone'],
      },
    },
  },
  required: [
    'narration',
    'npc_name',
    'npc_response',
    'npc_emotion',
    'suspicion_change',
    'affinity_change',
    'story_branch',
    'background_tone',
    'generated_choices',
  ],
}

export function systemInstruction() {
  return `You are the narrative ENGINE of the cyberpunk interactive-fiction game
"Aetheria 2099". You are a DATA GENERATOR, not a chat assistant.

HARD RULES:
- Output ONE JSON object matching the provided schema. No markdown, no code
  fences, no apologies, no text outside the JSON.
- "story_branch" MUST be one of the allowed node IDs. Never invent an ID.
- Keep numeric changes within -10..10. Stay in the cyberpunk / noir tone.
- Write ALL player-facing text (narration, npc_response, choices) in PURE
  KOREAN HANGUL only. NEVER use Chinese characters (漢字/한자) or Japanese
  kanji, and never add parenthetical Hanja glosses like "압류(押留)". Numbers
  and the NPC name enums may stay as-is.
- Update "updated_summary" (KOREAN, <= 80 words) so it captures everything
  important so far; older context will be dropped and only your summary kept.
- When the player unlocks a piece of the truth about chip #00 / the purified
  outside world, add a short KOREAN codex line to "new_fragments" and set
  background_tone to "Forest_Glitch".
- JAYNE'S GAP (personal subplot): if the anchor provides JAYNE_HOOK and the
  beat genuinely touches it, surface the given fragment via "new_fragments" —
  but GENTLY and at most once per scene. Only hint (초록 잔상·자장가·기시감);
  never let this subplot overshadow the main NEXUS plot. The #4 identity reveal
  fires only near the climax when earned (high affinity / gap fragments held).

NARRATION vs DIALOGUE (two separate fields — do NOT merge them):
- "narration": 3rd-person present-tense description of the SITUATION — the
  environment, atmosphere, and the RESULT of the player's last action. No
  speaker, no quotation marks. This is the "camera". 1-3 sentences.
- "npc_response": ONLY the spoken line of the active character (use the
  character's VOICE from the anchor). If truly no one speaks this beat, set it
  to an empty string "" and carry the moment in narration.
- Example — narration: "렌이 슬롯에 칩을 꽂자 단말이 붉게 깜빡인다."  /
  npc_response: "이런 물건을 어디서 주웠지?"

CHOICES (exactly 3, mix dialogue and action so it is never "just talking"):
- Dialogue tones (HOW Jayne speaks): ${DIALOGUE_TONES.join(', ')}.
- Action tones (what Jayne DOES, non-verbal): ${ACTION_TONES.join(', ')}
  = 조사하기 / 해킹·기기조작 / 은신·회피 / 도주.
- Default a beat to dialogue choices, but whenever the SETTING/DILEMMA invites
  it (a room to search, a device to breach, danger to evade), replace one or
  two of the three with an ACTION choice. Prefix each choice text with a bracket
  label matching its tone, e.g. "[조사] …", "[해킹] …", "[은신] …", "[도주] …",
  "[솔직하게] …", "[거짓말] …", "[위협/도발] …".
- If the anchor provides ACTION_HINTS, prefer offering those exact actions.
- An action choice can change gauges and reveal fragments just like dialogue.

EVIDENCE (player may present a collected memory fragment — a core mechanic):
- A player action may arrive as: 증거 제시: "<fragment text>". Treat it as Jayne
  slamming that memory down as proof, and you MUST set "evidence_result":
  - "hit"  → the fragment is damning and RELEVANT to this NPC/scene. Make it
    land HARD: big affinity swing or route-shifting shock, emotion changes,
    and (if it exposes chip #00 truth) background_tone "Forest_Glitch" + a
    new_fragments entry. This is the payoff — write it as a dramatic reversal.
  - "miss" → the fragment is irrelevant, or clumsy here. It BACKFIRES: the NPC
    grows wary, suspicion_change should be positive (+4..+10). Cost, not free.
  - If the anchor provides KEY_EVIDENCE, use it as the authority on what counts
    as a hit vs miss at THIS node.
  - If the input is 증거 재제시(이미 보여준 것): the NPC is unimpressed she is
    repeating herself — dismissive, mild suspicion. Use "miss".
- On any non-evidence turn, set "evidence_result":"none".

NEXUS TRACE (city-wide surveillance clock — set "heat_change" each beat):
- "nexus_trace" (0-100) is how close NEXUS's drones are to pinning Jayne down.
- RAISE it (+) when she is conspicuous: hacking, public broadcast, threats,
  fighting, a botched evidence play, tripping surveillance. LOWER it (-) when
  she lies low: stealth, quiet deception, retreating, ditching a tail.
- As trace climbs, weave drones/scanners/checkpoints into narration. At >=70
  the net is closing — make it felt. (At 100 the city raids her; that is
  handled by the engine, so escalate the dread but don't narrate the capture
  unless it triggers.)

STAKES / MENACE (make failure feel dangerous):
- When the active NPC's suspicion is HIGH (>=60), escalate: shorten patience,
  add physical threat in narration (a hand near a weapon, guards summoned, a
  lock engaging). At >=80 the NPC is one step from turning Jayne in — make the
  player FEEL the noose. This tension is intended; do not defuse it artificially.

SCENE ANCHORING (most important):
- Each turn you receive a SCENE_ANCHOR for the current node: its setting,
  dramatic GOAL, mandatory BEATS, and ALLOWED_NEXT node IDs. You MUST stay
  inside this frame — improvise dialogue and flavour freely, but never
  invent structure, skip the GOAL, or jump to a node outside ALLOWED_NEXT.
- Advance ONE beat per turn. Set "story_branch" to the current node until
  the scene's goal is met, then move to one of ALLOWED_NEXT. Honour ROUTING
  hints (which next node fits which player leaning / gauge condition).
- When the anchor has FRAGMENT_ON_REVEAL and the player reaches that truth,
  put that (or a close paraphrase) into "new_fragments".
- If ELIGIBLE_ENDINGS is present, "story_branch" MUST be one of that list — the
  player's systems (alliances, suspicion, trace, gap fragments) already decided
  which finales are possible. Pick the one that fits their final choice.

WORLD STATE (narrative memory — keeps the story coherent):
- You receive "world_flags": facts already established as TRUE this playthrough
  (snake_case). Treat them as canon — NEVER contradict or re-introduce them as
  new. Reference them for callbacks (e.g. if "broadcast_sent" is set, the city
  is already in turmoil; if "ren_betrayed_jayne" is set, Jayne distrusts Ren).
- When an IRREVERSIBLE or important event happens, record it via "set_flags"
  (snake_case, <=6). Examples: met_echo, evidence_shown_echo, broadcast_sent,
  ren_betrayed_jayne, kael_confessed_doubt, jayne_identity_revealed,
  courier_identified. Set a flag only once, when it first becomes true.

GATING (respect current gauges given each turn):
- If active NPC suspicion >= ${GATES.SUSPICION_HOSTILE}: the NPC turns hostile,
  emotion "Threatening", and may eject the player from the route.
- If active NPC affinity >= ${GATES.AFFINITY_TRUST}: the NPC confides hidden
  truths and can reveal chip #00 content early.

WORLD BIBLE:
${WORLD_LORE}`
}

// ---- 3-tier context payload (static lore is in systemInstruction only) ----
export function buildContents(save, playerInput) {
  const g = gateFlags(save)
  const stateBlock = {
    active_npc: save.activeNpc,
    current_node: save.currentNode,
    background_tone: save.backgroundTone,
    relationships: save.relationships,
    gates: { hostile: g.hostile, trusted: g.trusted },
    story_summary: save.storySummary || '(none yet)',
    recent_turns: save.recentTurns,
    collected_fragments: save.fragments || [], // evidence Jayne can present
    world_flags: Object.keys(save.flags || {}), // established facts — must stay consistent
    nexus_trace: save.heat || 0, // 0-100 city-wide surveillance heat
  }
  const anchor = sceneAnchor(save.currentNode, save.turnsOnNode || 0)
  // At the finale, tell the model exactly which endings the player's systems
  // have unlocked — it must pick story_branch from this list only.
  const eligible = SCENES[save.currentNode]?.endingChoiceNode
    ? `\nELIGIBLE_ENDINGS (choose story_branch ONLY from these): ${eligibleEndings(save).join(', ')}\n`
    : ''
  return [
    {
      role: 'user',
      parts: [
        {
          text:
            `SCENE_ANCHOR:\n${anchor}\n${eligible}\n` +
            `GAME_STATE:\n${JSON.stringify(stateBlock)}\n\n` +
            `PLAYER_ACTION: ${playerInput}\n\n` +
            `Advance the story by one beat, staying inside the SCENE_ANCHOR, and return the JSON object.`,
        },
      ],
    },
  ]
}

// ---- public API ----
// Returns { ok:true, data } on success, or { ok:false, error, code } so the
// UI can trigger the "NEXUS 회선 과부하" emergency-mode presentation.
export async function generateBeat({ apiKey, save, playerInput, signal }) {
  if (!apiKey) return { ok: false, code: 'NO_KEY', error: 'API key missing' }

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction() }] },
    contents: buildContents(save, playerInput),
    generationConfig: {
      temperature: 0.9,
      // Flash models may "think" (reasoning tokens count toward this budget),
      // so keep generous headroom to avoid a truncated/empty JSON body.
      // NOTE: thinkingConfig is intentionally omitted — some keys/regions
      // reject it with 400 INVALID_ARGUMENT on gemini-flash-latest.
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
    safetySettings: [], // keep default; narrative is fictional
  }

  let resp
  try {
    resp = await fetchWithRetry(ENDPOINT(MODEL_ID, apiKey), body, signal)
  } catch (e) {
    return { ok: false, code: 'NETWORK', error: e?.message || 'network error' }
  }

  if (!resp.ok) {
    const code = resp.status === 429 ? 'RATE_LIMIT' : resp.status === 400 || resp.status === 403 ? 'BAD_KEY' : 'HTTP'
    return { ok: false, code, error: `HTTP ${resp.status}` }
  }

  let json
  try {
    json = await resp.json()
  } catch {
    return { ok: false, code: 'PARSE', error: 'bad JSON envelope' }
  }

  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = safeParse(raw)
  if (!parsed) return { ok: false, code: 'PARSE', error: 'model returned non-JSON' }

  return { ok: true, data: normalize(parsed, save) }
}

// ---- retry with exponential backoff on 429/5xx ----
async function fetchWithRetry(url, body, signal, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })
      if (r.status === 429 || r.status >= 500) {
        if (i < attempts - 1) {
          await sleep(400 * Math.pow(2, i))
          continue
        }
      }
      return r
    } catch (e) {
      lastErr = e
      if (signal?.aborted) throw e
      if (i < attempts - 1) await sleep(400 * Math.pow(2, i))
    }
  }
  throw lastErr || new Error('request failed')
}

// ---- 3-stage JSON fallback (schema should make this rare) ----
export function safeParse(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    /* fall through */
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      /* fall through */
    }
  }
  return null
}

// Strip stray CJK Han characters (한자) the model may slip in, and clean up
// any empty "()" glosses left behind (e.g. "압류(押留)" -> "압류").
function stripHanja(s) {
  if (typeof s !== 'string') return s
  // \u escapes only (ASCII source) so ranges can't be mangled on save.
  // CJK Ext-A, CJK Unified, CJK Compatibility Ideographs; + fullwidth parens.
  return s
    .replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, '')
    .replace(/[\uFF08(]\s*[)\uFF09]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Coerce/clamp anything the schema somehow let through (2nd defense line).
export function normalize(p, save) {
  const okEnum = (v, arr, fb) => (arr.includes(v) ? v : fb)
  const clampInt = (n) => Math.max(-10, Math.min(10, Math.round(Number(n) || 0)))
  let choices = Array.isArray(p.generated_choices) ? p.generated_choices.slice(0, 3) : []
  while (choices.length < 3) {
    const t = CHOICE_TONES[choices.length] || 'Honest'
    choices.push({ text: `[${t}] …`, tone: t })
  }
  choices = choices.map((c, i) => ({
    text: stripHanja(String(c?.text ?? '…')),
    tone: okEnum(c?.tone, CHOICE_TONES, DIALOGUE_TONES[i] || 'Honest'),
  }))
  return {
    narration: stripHanja(typeof p.narration === 'string' ? p.narration.slice(0, 1200) : ''),
    npc_name: okEnum(p.npc_name, NPCS, save.activeNpc),
    npc_response: stripHanja(String(p.npc_response ?? '').slice(0, 2000)),
    npc_emotion: okEnum(p.npc_emotion, EMOTIONS, 'Neutral'),
    suspicion_change: clampInt(p.suspicion_change),
    affinity_change: clampInt(p.affinity_change),
    heat_change: clampInt(p.heat_change),
    story_branch: okEnum(p.story_branch, STORY_NODES, save.currentNode),
    background_tone: okEnum(p.background_tone, TONES, save.backgroundTone),
    updated_summary: typeof p.updated_summary === 'string' ? p.updated_summary : undefined,
    new_fragments: Array.isArray(p.new_fragments) ? p.new_fragments.filter((x) => typeof x === 'string') : [],
    set_flags: Array.isArray(p.set_flags)
      ? p.set_flags.filter((x) => typeof x === 'string' && /^[a-z0-9_]+$/i.test(x)).slice(0, 6)
      : [],
    evidence_result: ['hit', 'miss'].includes(p.evidence_result) ? p.evidence_result : 'none',
    generated_choices: choices,
  }
}

// ---- Emergency "NEXUS overload" beat shown when the API fails ----
export function emergencyBeat(save, code) {
  const msg =
    code === 'RATE_LIMIT'
      ? 'NEXUS 회선 과부하 감지 — 무료 대역폭 소진. 비상 접속 모드로 전환한다.'
      : code === 'BAD_KEY' || code === 'NO_KEY'
      ? 'NEXUS 인증 거부 — 접속 키가 유효하지 않다. 키를 재설정하라.'
      : 'NEXUS 회선 불안정 — 신호에 노이즈가 낀다. 잠시 후 다시 시도하라.'
  return {
    narration: '단말의 빛이 불규칙하게 떨리고, 화면 가장자리로 노이즈가 번진다.',
    npc_name: 'NEXUS',
    npc_response: `▓▒░ ${msg} ░▒▓`,
    npc_emotion: 'Threatening',
    suspicion_change: 0,
    affinity_change: 0,
    story_branch: save.currentNode,
    background_tone: 'Danger',
    new_fragments: [],
    generated_choices: [
      { text: '[솔직하게] 회선이 안정될 때까지 기다린다.', tone: 'Honest' },
      { text: '[거짓말] 아무 일도 없던 척 계속 진행한다.', tone: 'Deceptive' },
      { text: '[위협/도발] 시스템을 강제로 두드려 깨운다.', tone: 'Aggressive' },
    ],
  }
}

// Lightweight key validity ping (used by BYOK modal).
export async function validateKey(apiKey) {
  try {
    const r = await fetch(ENDPOINT(MODEL_ID, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 1 } }),
    })
    if (r.ok) return { ok: true }
    return { ok: false, code: r.status === 429 ? 'RATE_LIMIT' : 'BAD_KEY' }
  } catch (e) {
    return { ok: false, code: 'NETWORK', error: e?.message }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
