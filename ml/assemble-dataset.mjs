// prompts.jsonl(id→user,ctx) + beats.jsonl(id→beat) 를 합쳐 학습 데이터로 조립.
// 내가(교사) 쓴 비트도 게임과 동일한 normalize를 태워 스키마 100% 보장.
//   node ml/assemble-dataset.mjs   (기본 ml/dataset.jsonl 에 append)
import fs from 'fs'
import { SHORT_SYSTEM, normalize } from '../src/services/geminiService.js'

const PROMPTS = process.env.PROMPTS || 'ml/prompts.jsonl'
const BEATS = process.env.BEATS || 'ml/beats.jsonl'
const OUT = process.env.OUT || 'ml/dataset.jsonl'

const load = (f) => {
  const m = new Map()
  let bad = 0
  for (const l of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    try {
      const o = JSON.parse(l)
      if (o && o.id != null) m.set(o.id, o)
    } catch {
      bad++ // 에이전트 산출의 불량 줄은 건너뜀
    }
  }
  if (bad) console.warn(`⚠︎ ${f}: 불량 줄 ${bad}개 건너뜀`)
  return m
}
const prompts = load(PROMPTS)
const beats = load(BEATS)

const stream = fs.createWriteStream(OUT, { flags: 'a' })
let n = 0
for (const [id, b] of beats) {
  const p = prompts.get(id)
  if (!p) {
    console.warn(`⚠︎ id ${id}: 프롬프트 없음, 건너뜀`)
    continue
  }
  const save = p.ctx || { activeNpc: 'NEXUS', currentNode: 'PROLOGUE_RAIN_01', backgroundTone: 'Danger' }
  const clean = normalize(b.beat, save) // 스키마/한자/선택지 길이 보정
  stream.write(
    JSON.stringify({
      messages: [
        { role: 'system', content: SHORT_SYSTEM },
        { role: 'user', content: p.user },
        { role: 'assistant', content: JSON.stringify(clean) },
      ],
    }) + '\n',
  )
  n++
}
stream.end()
console.log(`✅ ${n}개 조립 → ${OUT}`)
