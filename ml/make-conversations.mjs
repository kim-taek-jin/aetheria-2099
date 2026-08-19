// 멀티턴 대화 시드 생성기.
//  각 시드 = { id, node, initialState(save), playerInputs:[K] }.
//  Workflow가 각 시드를 실제 게임처럼 K턴 이어 플레이(직전 대사를 알고 다르게 응답)하고,
//  assemble-conversations.mjs 가 게임 루프로 재생해 "문맥 포함" 학습쌍을 만든다.
//  목적: 모델이 "직전 대사와 다르게 말하는 법"을 배우게 함(턴 간 반복의 근본 해결).
//    M=40 K=4 node ml/make-conversations.mjs
import fs from 'fs'
import { SCENES, isEnding, sceneAnchor } from '../src/game/scenes.js'
import { createNewGame } from '../src/game/state.js'
import { TONES, DIALOGUE_TONES, ACTION_TONES } from '../src/game/lore.js'

const M = Number(process.env.M || 40) // 대화 개수
const K = Number(process.env.K || 4) // 대화당 턴 수
const OUT = process.env.OUT || 'ml/conversations.jsonl'
const START = Number(process.env.START || 0)

// 시작 노드는 "장면 초입"에 해당하는 노드들(엔딩 제외). NPC 균형 라운드로빈.
const ALLNODES = Object.keys(SCENES).filter((id) => !isEnding(id))
const BY_NPC = {}
for (const id of ALLNODES) (BY_NPC[SCENES[id].npc || 'NEXUS'] ||= []).push(id)
const NPC_KEYS = Object.keys(BY_NPC)
const pickNode = (i) => {
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

function initialSave(nodeId) {
  const s = createNewGame()
  s.currentNode = nodeId
  s.turnsOnNode = 0 // 장면 초입에서 시작해 K턴 전개
  s.turnCount = ri(1, 12)
  s.heat = ri(0, 70)
  for (const n of ['Ren', 'Kael', 'Echo']) {
    s.relationships[n].suspicion = ri(0, 70)
    s.relationships[n].affinity = ri(10, 70)
  }
  s.activeNpc = SCENES[nodeId].npc || 'NEXUS'
  s.backgroundTone = SCENES[nodeId].tone || rand(TONES)
  if (Math.random() < 0.6) s.fragments = FRAGS.slice(0, ri(1, 3))
  return s
}

const labelMap = { Honest: '[솔직하게]', Deceptive: '[거짓말]', Aggressive: '[위협/도발]', Investigate: '[조사]', Hack: '[해킹]', Stealth: '[은신]', Flee: '[도주]' }
const DIALOGUES = [
  '이 칩이 뭔지 똑바로 말해.', '난 여기서 나가고 싶을 뿐이야.', '당신을 믿어도 되나?',
  '거짓말은 그만하고 본론으로.', '넌 누구지? 왜 나한테 이걸 줬어?', '원하는 게 뭐야. 돌려 말하지 마.',
  '그 대가가 뭔데?', '내가 왜 널 도와야 하지?', '한 번만 더 설명해봐.', '그래서, 다음은 뭐야?',
]
function oneInput(save, turn) {
  const roll = Math.random()
  // 첫 턴은 증거를 아껴 자연스러운 도입, 이후 턴에서 증거·행동 섞기.
  if (turn > 0 && roll < 0.25 && (save.fragments || []).length) return `증거 제시: "${rand(save.fragments)}"`
  if (roll < 0.55) return rand(DIALOGUES)
  const tone = rand([...DIALOGUE_TONES, ...ACTION_TONES])
  const verb = rand(['상황을 살핀다', '상대를 떠본다', '진실을 요구한다', '거래를 제안한다', '뒤로 물러선다', '한 걸음 다가선다'])
  return `${labelMap[tone] || '[솔직하게]'} ${verb}.`
}

const stream = fs.createWriteStream(OUT, { flags: START > 0 ? 'a' : 'w' })
for (let i = 0; i < M; i++) {
  const nodeId = pickNode(START + i)
  const save = initialSave(nodeId)
  // K개의 플레이어 입력을 미리 뽑는다(상태는 assemble에서 실제로 진행).
  const playerInputs = Array.from({ length: K }, (_, t) => oneInput(save, t))
  const anchor = sceneAnchor(nodeId, 0)
  stream.write(
    JSON.stringify({
      id: START + i,
      node: nodeId,
      npc: save.activeNpc,
      anchor, // 서브에이전트가 볼 장면 규칙(참고용; assemble은 자체 재생)
      initialState: save,
      playerInputs,
    }) + '\n'
  )
}
stream.end()
console.log(`✅ 대화 시드 ${M}개(턴 ${K}) → ${OUT} (id ${START}..${START + M - 1})`)
