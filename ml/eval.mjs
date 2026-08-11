// ============================================================
//  평가(Eval) — 파인튜닝한 모델이 게임 JSON을 얼마나 잘 뽑는지 측정.
//
//  홀드아웃 프롬프트(ml/eval.jsonl)를 모델에 넣어 생성시키고,
//  여러 검사(파싱·스키마·enum·노드·범위·한국어·선택지)를 통과율로 집계한다.
//
//  홀드아웃 만들기(학습에 안 쓴 예제로):
//    tail -n 40 ml/dataset.jsonl > ml/eval.jsonl
//    # (그 40줄은 학습에서 빼두는 게 정석. 급하면 그냥 써도 대략 감은 잡힘)
//
//  실행:
//    # Ollama(로컬 파인튜닝 모델) 평가 — 기본
//    OLLAMA_MODEL=aetheria node ml/eval.mjs
//    # Gemini 베이스라인과 비교
//    PROVIDER=gemini GEMINI_API_KEY=... node ml/eval.mjs
//  옵션: EVAL_FILE(기본 ml/eval.jsonl), LIMIT(기본 전체),
//        OLLAMA_URL(기본 http://localhost:11434), OLLAMA_MODEL
// ============================================================

import fs from 'fs'
import { STORY_NODES, NPCS, EMOTIONS, TONES, CHOICE_TONES } from '../src/game/lore.js'

const PROVIDER = process.env.PROVIDER || 'ollama'
const EVAL_FILE = process.env.EVAL_FILE || 'ml/eval.jsonl'
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'aetheria'
const GEMINI_KEY = process.env.GEMINI_API_KEY

if (!fs.existsSync(EVAL_FILE)) {
  console.error(`❌ ${EVAL_FILE} 없음. 홀드아웃을 먼저 만드세요:\n   tail -n 40 ml/dataset.jsonl > ml/eval.jsonl`)
  process.exit(1)
}

const HANJA = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/
const NODES = new Set(STORY_NODES)
const inRange = (n) => Number.isInteger(n) && n >= -10 && n <= 10

// 관대한 JSON 추출(첫 { ~ 마지막 }).
function parse(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {}
  const a = text.indexOf('{'),
    b = text.lastIndexOf('}')
  if (a !== -1 && b > a) {
    try {
      return JSON.parse(text.slice(a, b + 1))
    } catch {}
  }
  return null
}

// 하나의 출력에 대한 검사 결과(각 항목 true/false).
function score(text) {
  const p = parse(text)
  const r = {
    parseable: !!p,
    required: false,
    enums: false,
    node_valid: false,
    ranges: false,
    choices3: false,
    korean_only: false,
  }
  if (!p) return r
  const req = ['narration', 'npc_name', 'npc_response', 'npc_emotion', 'suspicion_change', 'affinity_change', 'story_branch', 'background_tone', 'generated_choices']
  r.required = req.every((k) => k in p)
  r.enums =
    NPCS.includes(p.npc_name) &&
    EMOTIONS.includes(p.npc_emotion) &&
    TONES.includes(p.background_tone)
  r.node_valid = NODES.has(p.story_branch)
  r.ranges = inRange(p.suspicion_change) && inRange(p.affinity_change)
  const ch = Array.isArray(p.generated_choices) ? p.generated_choices : []
  r.choices3 = ch.length === 3 && ch.every((c) => c && typeof c.text === 'string' && CHOICE_TONES.includes(c.tone))
  const facing = [p.narration, p.npc_response, ...ch.map((c) => c?.text || '')].join(' ')
  r.korean_only = !HANJA.test(facing)
  return r
}

// ---- 프로바이더: 프롬프트(messages)로 assistant 텍스트 생성 ----
async function genOllama(messages) {
  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false, options: { temperature: 0.9, num_predict: 1024 } }),
  })
  if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`)
  const j = await r.json()
  return j?.message?.content || ''
}

async function genGemini(messages) {
  const sys = messages.find((m) => m.role === 'system')?.content || ''
  const user = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    }),
  })
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`)
  const j = await r.json()
  return j?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

const gen = PROVIDER === 'gemini' ? genGemini : genOllama
if (PROVIDER === 'gemini' && !GEMINI_KEY) {
  console.error('❌ gemini 모드엔 GEMINI_API_KEY 필요')
  process.exit(1)
}

// ---- 실행 ----
const lines = fs.readFileSync(EVAL_FILE, 'utf8').split('\n').filter(Boolean).slice(0, LIMIT)
console.log(`▓ ${PROVIDER} 평가 · ${lines.length}개 · 파일 ${EVAL_FILE}\n`)

const agg = { parseable: 0, required: 0, enums: 0, node_valid: 0, ranges: 0, choices3: 0, korean_only: 0 }
let n = 0
const failures = []

for (const line of lines) {
  let ex
  try {
    ex = JSON.parse(line)
  } catch {
    continue
  }
  // system + user 만 넣어 생성(assistant는 정답이라 제외)
  const prompt = ex.messages.filter((m) => m.role !== 'assistant')
  let out = ''
  try {
    out = await gen(prompt)
  } catch (e) {
    console.log(`  ⚠︎ 생성 실패: ${e.message}`)
    continue
  }
  const r = score(out)
  n++
  for (const k of Object.keys(agg)) if (r[k]) agg[k]++
  if (!r.parseable || !r.node_valid || !r.korean_only) {
    if (failures.length < 3) failures.push(out.slice(0, 200))
  }
  if (n % 10 === 0) console.log(`  … ${n}/${lines.length}`)
}

// ---- 리포트 ----
const pct = (x) => (n ? ((100 * x) / n).toFixed(1) + '%' : '-')
console.log(`\n=== 결과 (${n}개) ===`)
console.log(`  JSON 파싱      ${pct(agg.parseable)}`)
console.log(`  필수 필드      ${pct(agg.required)}`)
console.log(`  enum 유효      ${pct(agg.enums)}`)
console.log(`  노드 유효      ${pct(agg.node_valid)}`)
console.log(`  수치 범위      ${pct(agg.ranges)}`)
console.log(`  선택지 3개     ${pct(agg.choices3)}`)
console.log(`  한국어 전용    ${pct(agg.korean_only)}`)
const overall = n ? (100 * (agg.parseable + agg.required + agg.enums + agg.node_valid + agg.ranges + agg.choices3 + agg.korean_only)) / (7 * n) : 0
console.log(`  ── 종합 준수율  ${overall.toFixed(1)}%`)
if (failures.length) {
  console.log(`\n실패 예시:`)
  failures.forEach((f, i) => console.log(`  [${i + 1}] ${f.replace(/\n/g, ' ')}`))
}
