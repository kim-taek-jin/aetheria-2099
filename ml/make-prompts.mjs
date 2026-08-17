// Claude(이 세션)를 교사로 쓰기 위한 입력 프롬프트 생성기.
//  게임과 동일한 (save → user 프롬프트)를 N개 만들어 ml/prompts.jsonl 로 저장.
//  이후 Claude가 각 프롬프트의 JSON 비트를 만들면 assemble-dataset.mjs 가 합친다.
//    N=8 node ml/make-prompts.mjs
import fs from 'fs'
import { buildContents } from '../src/services/geminiService.js'
import { SCENES, isEnding } from '../src/game/scenes.js'
import { createNewGame } from '../src/game/state.js'
import { NPCS, TONES, DIALOGUE_TONES, ACTION_TONES } from '../src/game/lore.js'

const N = Number(process.env.N || 8)
const OUT = process.env.OUT || 'ml/prompts.jsonl'
const START = Number(process.env.START || 0) // id 시작(이어붙이기용)

const ALLNODES = Object.keys(SCENES).filter((id) => !isEnding(id))
// NPC 균형: 노드를 무대 NPC별로 묶어 라운드로빈(장면과 NPC가 항상 일치 → 오염 없음).
const BY_NPC = {}
for (const id of ALLNODES) (BY_NPC[SCENES[id].npc || 'NEXUS'] ||= []).push(id)
const NPC_KEYS = Object.keys(BY_NPC)
function pickNode(i) {
  const grp = BY_NPC[NPC_KEYS[i % NPC_KEYS.length]]
  return grp[Math.floor(i / NPC_KEYS.length) % grp.length]
}
const FRAGS = [
  '기록 조각: 도시 밖 스카이라인이 초록이었다.',
  '기억 조각 · 아렌의 인식표: 카엘이 놓아준 진실 추적자 아렌의 군용 인식표.',
  '기억 조각 · 미매각 칩 #00-X: 렌이 유일하게 못 판, 사랑했던 이의 미소.',
  '빈자리 조각 #3: 자장가가 리엔의 인코딩된 음성과 일치한다.',
]
const rand = (a) => a[Math.floor(Math.random() * a.length)]
const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

function randomSave(nodeId) {
  const s = createNewGame()
  s.currentNode = nodeId
  s.turnsOnNode = ri(0, 2)
  s.turnCount = ri(1, 16)
  s.heat = ri(0, 90)
  for (const n of ['Ren', 'Kael', 'Echo']) {
    s.relationships[n].suspicion = ri(0, 90)
    s.relationships[n].affinity = ri(0, 90)
  }
  s.activeNpc = SCENES[nodeId].npc || 'NEXUS' // 장면의 실제 NPC(오염 방지)
  s.backgroundTone = SCENES[nodeId].tone || rand(TONES)
  if (Math.random() < 0.7) s.fragments = FRAGS.slice(0, ri(1, 3)) // 증거 케이스 확보
  return s
}

const labelMap = { Honest: '[솔직하게]', Deceptive: '[거짓말]', Aggressive: '[위협/도발]', Investigate: '[조사]', Hack: '[해킹]', Stealth: '[은신]', Flee: '[도주]' }
function randomInput(save) {
  const roll = Math.random()
  if (roll < 0.28 && (save.fragments || []).length) return `증거 제시: "${rand(save.fragments)}"` // 증거 비율↑
  if (roll < 0.5)
    return rand([
      '이 칩이 뭔지 똑바로 말해.', '난 여기서 나가고 싶을 뿐이야.', '당신을 믿어도 되나?',
      '거짓말은 그만하고 본론으로.', '넌 누구지? 왜 나한테 이걸 줬어?',
      '이 도시에서 벗어날 방법이 있긴 해?', '원하는 게 뭐야. 돌려 말하지 마.',
    ])
  const tone = rand([...DIALOGUE_TONES, ...ACTION_TONES])
  const verb = rand(['상황을 살핀다', '상대를 떠본다', '진실을 요구한다', '거래를 제안한다', '뒤로 물러선다'])
  return `${labelMap[tone] || '[솔직하게]'} ${verb}.`
}

const stream = fs.createWriteStream(OUT, { flags: START > 0 ? 'a' : 'w' })
for (let i = 0; i < N; i++) {
  const nodeId = pickNode(START + i) // NPC별 라운드로빈으로 균형
  const save = randomSave(nodeId)
  const playerInput = randomInput(save)
  const user = buildContents(save, playerInput)[0].parts[0].text
  const ctx = { activeNpc: save.activeNpc, currentNode: save.currentNode, backgroundTone: save.backgroundTone }
  stream.write(JSON.stringify({ id: START + i, user, ctx }) + '\n')
}
stream.end()
console.log(`✅ 프롬프트 ${N}개 → ${OUT} (id ${START}..${START + N - 1})`)
