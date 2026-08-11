// ============================================================
//  증류(Distillation) 데이터셋 생성기
//
//  게임이 Gemini에 보내는 것과 "완전히 같은 입력"으로 Gemini를 돌려,
//  (system, user, assistant=정제된 JSON) 쌍을 JSONL로 모은다.
//  이 데이터로 소형 모델을 파인튜닝하면 게임과 같은 형식을 배운다.
//
//  실행:
//    GEMINI_API_KEY=AIza... node ml/generate-dataset.mjs
//  옵션(환경변수):
//    TARGET=500     생성 목표 개수(기본 300)
//    DELAY_MS=4500  호출 간격(무료 티어 RPM 대응, 기본 4500ms)
//    OUT=ml/dataset.jsonl  출력 파일
//
//  특징: 이어하기(append) 지원 — 중단해도 다시 돌리면 목표까지 채운다.
//        무료 티어 일일 한도(RPD)에 걸리면 다음 날 이어서 돌리면 된다.
// ============================================================

import fs from 'fs'
import { buildContents, generateBeat, SHORT_SYSTEM } from '../src/services/geminiService.js'
import { SCENES, isEnding } from '../src/game/scenes.js'
import { createNewGame } from '../src/game/state.js'
import { NPCS, TONES, DIALOGUE_TONES, ACTION_TONES } from '../src/game/lore.js'

// SHORT_SYSTEM은 geminiService에서 import — 학습(여기)과 추론(ollamaProvider)이
// 동일한 시스템 문자열을 쓰도록 단일 출처로 관리한다.
const KEY = process.env.GEMINI_API_KEY
const TARGET = Number(process.env.TARGET || 300)
const DELAY_MS = Number(process.env.DELAY_MS || 4500)
const OUT = process.env.OUT || 'ml/dataset.jsonl'

if (!KEY) {
  console.error('❌ GEMINI_API_KEY 환경변수가 필요합니다.\n   예: GEMINI_API_KEY=AIza... node ml/generate-dataset.mjs')
  process.exit(1)
}

// 엔딩이 아닌 노드만 학습 대상(엔딩은 정적이라 굳이 학습 불필요).
const NODES = Object.keys(SCENES).filter((id) => !isEnding(id))

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 무작위 게임 상태를 만든다(다양성 확보).
function randomSave(nodeId) {
  const s = createNewGame()
  s.currentNode = nodeId
  s.turnsOnNode = randint(0, 2)
  s.turnCount = randint(1, 14)
  s.heat = randint(0, 90)
  for (const n of ['Ren', 'Kael', 'Echo']) {
    s.relationships[n].suspicion = randint(0, 90)
    s.relationships[n].affinity = randint(0, 90)
  }
  // 무대 NPC 추정
  s.activeNpc = SCENES[nodeId].npc || 'NEXUS'
  s.backgroundTone = SCENES[nodeId].tone || rand(TONES)
  // 가끔 조각/플래그를 채워 증거·콜백 상황도 학습
  if (Math.random() < 0.5) {
    s.fragments = [
      '기록 조각: 도시 밖 스카이라인이 초록이었다.',
      '기억 조각 · 아렌의 인식표: 카엘이 놓아준 진실 추적자 아렌의 군용 인식표.',
      '기억 조각 · 미매각 칩 #00-X: 렌이 유일하게 못 판, 사랑했던 이의 미소.',
    ].slice(0, randint(1, 3))
  }
  return s
}

// 무작위 플레이어 입력(선택지형/자유/증거).
function randomInput(save) {
  const roll = Math.random()
  const tone = rand([...DIALOGUE_TONES, ...ACTION_TONES])
  const labelMap = {
    Honest: '[솔직하게]',
    Deceptive: '[거짓말]',
    Aggressive: '[위협/도발]',
    Investigate: '[조사]',
    Hack: '[해킹]',
    Stealth: '[은신]',
    Flee: '[도주]',
  }
  if (roll < 0.15 && (save.fragments || []).length) {
    // 증거 제시
    return `증거 제시: "${rand(save.fragments)}"`
  }
  if (roll < 0.35) {
    // 자유 입력(짧은 한국어 대사)
    return rand([
      '솔직히 말해줘. 이 칩이 대체 뭐지?',
      '난 여기서 나가고 싶을 뿐이야.',
      '당신을 믿어도 되나?',
      '거짓말은 그만하고 본론으로.',
      '한 발만 잘못 디디면 우리 둘 다 끝이야.',
    ])
  }
  // 선택지형 입력
  const verb = rand([
    '상황을 살핀다',
    '상대를 떠본다',
    '진실을 요구한다',
    '거래를 제안한다',
    '뒤로 물러선다',
  ])
  return `${labelMap[tone] || '[솔직하게]'} ${verb}.`
}

// 기존 개수(이어하기).
let existing = 0
if (fs.existsSync(OUT)) {
  existing = fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).length
  console.log(`↩︎ 기존 ${existing}개 발견 — 이어서 생성합니다.`)
}

const stream = fs.createWriteStream(OUT, { flags: 'a' })
let made = existing
let fail = 0
console.log(`▓ 목표 ${TARGET}개 · 간격 ${DELAY_MS}ms · 출력 ${OUT}\n`)

let i = 0
while (made < TARGET) {
  const nodeId = NODES[i % NODES.length] // 노드를 골고루 순환
  i++
  const save = randomSave(nodeId)
  const playerInput = randomInput(save)

  // 게임과 동일한 user(앵커+상태). generateBeat는 내부적으로 전체 systemInstruction을
  // 써서 Gemini를 호출하지만, 학습 레코드의 system은 짧은 것으로 저장한다.
  const user = buildContents(save, playerInput)[0].parts[0].text

  const res = await generateBeat({ apiKey: KEY, save, playerInput })
  if (res.ok) {
    const line = JSON.stringify({
      messages: [
        { role: 'system', content: SHORT_SYSTEM },
        { role: 'user', content: user },
        { role: 'assistant', content: JSON.stringify(res.data) },
      ],
    })
    stream.write(line + '\n')
    made++
    if (made % 10 === 0) console.log(`  ✅ ${made}/${TARGET} (node=${nodeId})`)
  } else {
    fail++
    if (res.code === 'RATE_LIMIT') {
      console.log(`  ⏳ RATE_LIMIT — 60초 대기 후 재개 (일일 한도면 내일 이어서)`)
      await sleep(60000)
    } else {
      console.log(`  ⚠︎ 실패(${res.code}) — 건너뜀`)
    }
  }
  await sleep(DELAY_MS)
}

stream.end()
console.log(`\n✅ 완료: ${made}개 (신규 ${made - existing}, 실패 ${fail}). → ${OUT}`)
