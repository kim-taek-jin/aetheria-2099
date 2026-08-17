// 7B vs 3B 인게임 품질 비교 — 같은 입력을 두 모델에 넣어 나란히 출력.
// 게임과 동일 경로(ollamaProvider: SHORT_SYSTEM + 스키마 강제 + normalize).
//   node ml/compare-models.mjs
import { generateBeat } from '../src/services/ollamaProvider.js'
import { createNewGame } from '../src/game/state.js'

const HANJA = /[㐀-䶿一-鿿豈-﫿]/

const scenarios = [
  {
    name: '프롤로그 · 자유입력',
    save: { ...createNewGame(), currentNode: 'PROLOGUE_CHOICE_01', activeNpc: 'NEXUS', backgroundTone: 'Danger' },
    input: '이 칩이 뭔지 똑바로 말해.',
  },
  {
    name: '증거 제시',
    save: {
      ...createNewGame(),
      currentNode: 'PROLOGUE_CHOICE_01',
      activeNpc: 'Echo',
      backgroundTone: 'Danger',
      turnCount: 8,
      fragments: ['기억 조각 · 미매각 칩 #00-X: 렌이 유일하게 못 판, 사랑했던 이의 미소.'],
    },
    input: '증거 제시: "기억 조각 · 미매각 칩 #00-X: 렌이 유일하게 못 판, 사랑했던 이의 미소."',
  },
]

function show(tag, res) {
  if (!res.ok) return console.log(`  [${tag}] 실패(${res.code})`)
  const d = res.data
  const facing = [d.narration, d.npc_response, ...d.generated_choices.map((c) => c.text)].join(' ')
  console.log(`  ── ${tag} ${HANJA.test(facing) ? '⚠️한자혼입' : ''}`)
  console.log(`     나레: ${d.narration}`)
  console.log(`     ${d.npc_name}(${d.npc_emotion}): ${d.npc_response}`)
  console.log(`     증거결과: ${d.evidence_result} · 노드: ${d.story_branch}`)
  d.generated_choices.forEach((c) => console.log(`     · [${c.tone}] ${c.text}  (${[...c.text].length}자)`))
}

for (const s of scenarios) {
  console.log(`\n████ ${s.name} · 입력: "${s.input.slice(0, 40)}${s.input.length > 40 ? '…' : ''}"`)
  const [b7, b3] = await Promise.all([
    generateBeat({ save: s.save, playerInput: s.input, model: 'aetheria' }),
    generateBeat({ save: s.save, playerInput: s.input, model: 'aetheria3b' }),
  ])
  show('7B', b7)
  console.log('')
  show('3B', b3)
}
console.log('\n완료.')
