// 방어층 실측 — 모델 원문(raw)이 얼마나 틀리는지 vs 플레이어가 실제로 오류를 보는 비율.
// normalize()는 전역 폴백이라 구조적으로는 항상 유효한 beat이 나온다. 따라서
// 진짜 실패는 (1) JSON 파싱 불가 (2) 통과했지만 읽기 불가능한 본문 — 두 가지뿐.
import fs from 'fs'
import { safeParse, normalize, hasGarble } from '../src/services/geminiService.js'
import { createNewGame } from '../src/game/state.js'
import { STORY_NODES, NPCS, EMOTIONS, TONES, CHOICE_TONES } from '../src/game/lore.js'

const MODEL = process.env.OLLAMA_MODEL || 'aetheria'
const TEMP = process.env.EVAL_TEMP ? Number(process.env.EVAL_TEMP) : 0.65
const HAN = /[一-鿿]/
const REPEAT = process.env.REPEAT ? Number(process.env.REPEAT) : 1
const base = fs.readFileSync('ml/eval.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l))
const rows = Array.from({ length: REPEAT }, () => base).flat() // 표본 확대(샘플링 노이즈 완화)

const save = createNewGame()

async function gen(messages, temperature) {
  try {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: false, options: { temperature, num_predict: 1024 } }),
    })
    return (await r.json())?.message?.content || ''
  } catch { return '' }
}
const stat = { n: 0, rawParse: 0, rawSchema: 0, normOk: 0, playable: 0, hardFail: 0, healed: 0, degraded: [] }

// 원문이 스키마를 "그대로" 만족하는가 (= 방어층 없이도 통과)
function rawSchemaOk(p) {
  if (!p || typeof p !== 'object') return false
  const c = p.generated_choices
  return (
    typeof p.narration === 'string' && p.narration.trim() !== '' &&
    NPCS.includes(p.npc_name) && typeof p.npc_response === 'string' && p.npc_response.trim() !== '' &&
    EMOTIONS.includes(p.npc_emotion) && TONES.includes(p.background_tone) &&
    STORY_NODES.includes(p.story_branch) &&
    [p.suspicion_change, p.affinity_change].every((n) => Number.isInteger(n) && n >= -10 && n <= 10) &&
    Array.isArray(c) && c.length === 3 && c.every((x) => x && typeof x.text === 'string' && CHOICE_TONES.includes(x.tone))
  )
}

// 정규화 후 "사람이 읽을 수 있는가" — 방어층이 못 고치는 마지막 층.
function readable(b) {
  const body = `${b.narration} ${b.npc_response}`
  if (b.narration.trim().length < 10 || b.npc_response.trim().length < 4) return '본문 비어있음'
  // 프로덕션과 동일한 검출기를 쓴다(측정과 방어가 어긋나지 않도록).
  if (hasGarble(b.narration) || hasGarble(b.npc_response)) return '깨진 토큰'
  const hangul = (body.match(/[가-힣]/g) || []).length
  if (hangul / body.length < 0.55) return '한글 비율 저하'
  return null
}

for (const ex of rows) {
  stat.n++
  const messages = ex.messages.filter((m) => m.role !== 'assistant')
  const text = await gen(messages, TEMP)

  const parsed = safeParse(text)
  if (parsed) stat.rawParse++
  if (rawSchemaOk(parsed)) stat.rawSchema++
  if (!parsed) { stat.hardFail++; continue } // 방어층도 못 구함 → 재시도/비상 beat

  const b = normalize(parsed, save)
  stat.normOk++
  const why = readable(b)
  if (why) {
    stat.degraded.push({ why, sample: `${b.narration.slice(0, 60)} | ${b.npc_response.slice(0, 40)}` })
    // ── 프로덕션 재시도 시뮬레이션: 깨짐이면 온도를 낮춰 1회 재생성 ──
    const rt = why === '깨진 토큰' ? 0.45 : 0.85
    const p2 = safeParse(await gen(messages, rt))
    if (p2) {
      const b2 = normalize(p2, save)
      if (!readable(b2)) stat.healed++
    }
  } else stat.playable++
  if (stat.n % 10 === 0) console.log(`  … ${stat.n}/${rows.length}`)
}

const pct = (x) => `${((x / stat.n) * 100).toFixed(1)}%`
console.log(`\n=== 방어층 실측 · ${MODEL} · temp ${TEMP} · ${stat.n}개 ===`)
console.log(`  ① 원문이 스키마 그대로 통과   ${pct(stat.rawSchema)}   ← 방어층 없을 때`)
console.log(`  ② JSON 파싱은 성공            ${pct(stat.rawParse)}`)
console.log(`  ③ 정규화 후 구조 유효         ${pct(stat.normOk)}   ← 방어층 통과`)
console.log(`  ④ 읽을 수 있는 본문(최종)     ${pct(stat.playable)}   ← 플레이어 체감`)
console.log(`  ✗ 하드 실패(재시도/비상 beat) ${pct(stat.hardFail)}`)
console.log(`\n  ⟳ 재시도로 복구된 열화          ${stat.healed}/${stat.degraded.length}`)
console.log(`  ⑤ 재시도 후 최종 정상            ${pct(stat.playable + stat.healed)}   ← 실제 배선 반영`)
const byWhy = {}
for (const d of stat.degraded) byWhy[d.why] = (byWhy[d.why] || 0) + 1
if (stat.degraded.length) {
  console.log(`\n  남은 열화(구조는 멀쩡, 문장이 나쁨): ${JSON.stringify(byWhy)}`)
  for (const d of stat.degraded.slice(0, 3)) console.log(`   - [${d.why}] ${d.sample}`)
}
