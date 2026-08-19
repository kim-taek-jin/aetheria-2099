// 멀티턴 대화를 게임 루프로 재생해 "문맥 포함" 학습쌍으로 조립.
//  입력: conversations.jsonl(시드: id,initialState,playerInputs) + beats-conv.jsonl(id, beats:[K])
//  각 대화를 initialState부터 turn별로 재생:
//    user_t = buildContents(state, input_t)   ← 직전 턴들(recentTurns)이 담긴 학습 입력
//    target = normalize(rawBeat_t, state)
//    state  = applyResponse(state, target, input_t)  ← 다음 턴 문맥 누적
//  결과: recentTurns가 채워진 예시가 "직전 대사와 다르게 말하는 법"을 가르친다.
//    node ml/assemble-conversations.mjs
import fs from 'fs'
import { SHORT_SYSTEM, normalize, buildContents } from '../src/services/geminiService.js'
import { applyResponse } from '../src/game/state.js'

const CONVS = process.env.CONVS || 'ml/conversations.jsonl'
const BEATS = process.env.BEATS || 'ml/beats-conv.jsonl'
const OUT = process.env.OUT || 'ml/dataset.jsonl'

const load = (f) => {
  const m = new Map()
  let bad = 0
  for (const l of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    try {
      const o = JSON.parse(l)
      if (o && o.id != null) m.set(o.id, o)
    } catch {
      bad++
    }
  }
  if (bad) console.warn(`⚠︎ ${f}: 불량 줄 ${bad}개 건너뜀`)
  return m
}

const convs = load(CONVS)
const beatsById = load(BEATS)

const stream = fs.createWriteStream(OUT, { flags: 'a' })
let examples = 0
let ctxExamples = 0 // recentTurns가 실제로 담긴(멀티턴) 예시 수
for (const [id, seed] of convs) {
  const gen = beatsById.get(id)
  if (!gen || !Array.isArray(gen.beats)) {
    console.warn(`⚠︎ id ${id}: 비트 없음, 건너뜀`)
    continue
  }
  let state = structuredClone(seed.initialState)
  const inputs = seed.playerInputs || []
  const K = Math.min(inputs.length, gen.beats.length)
  for (let t = 0; t < K; t++) {
    const playerInput = inputs[t]
    const user = buildContents(state, playerInput)[0].parts[0].text
    let clean
    try {
      clean = normalize(gen.beats[t], state)
    } catch {
      break // 이 대화의 나머지는 건너뜀
    }
    if ((state.recentTurns || []).length > 0) ctxExamples++
    stream.write(
      JSON.stringify({
        messages: [
          { role: 'system', content: SHORT_SYSTEM },
          { role: 'user', content: user },
          { role: 'assistant', content: JSON.stringify(clean) },
        ],
      }) + '\n'
    )
    examples++
    state = applyResponse(state, clean, playerInput) // 상태 진행 → recentTurns 누적
  }
}
stream.end()
console.log(`✅ ${examples}개 조립 → ${OUT} (그중 문맥 포함 ${ctxExamples}개)`)
