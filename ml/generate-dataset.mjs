// ============================================================
//  증류(Distillation) 데이터셋 생성기
//
//  게임이 교사 모델에 보내는 것과 "완전히 같은 입력"으로 교사를 돌려,
//  (system, user, assistant=정제된 JSON) 쌍을 JSONL로 모은다.
//  이 데이터로 소형 모델을 파인튜닝하면 게임과 같은 형식을 배운다.
//
//  교사(PROVIDER)는 둘 중 하나:
//    - claude  : Anthropic Messages API (유료·빠름·rate limit 여유). 기본 Haiku 4.5.
//                프롬프트 캐싱으로 매번 같은 systemInstruction 비용을 ~90% 절감.
//    - gemini  : Google 무료 티어 (느림·일일 한도, 대신 공짜로 대량).
//
//  실행:
//    # Claude (약 $2 크레딧 → Haiku 4.5로 ~500개)
//    PROVIDER=claude ANTHROPIC_API_KEY=sk-ant-... node ml/generate-dataset.mjs
//    # Gemini 무료
//    PROVIDER=gemini GEMINI_API_KEY=AIza... node ml/generate-dataset.mjs
//
//  옵션(환경변수):
//    TARGET=500        생성 목표 개수(기본 300)
//    DELAY_MS          호출 간격(기본 claude=800ms, gemini=4500ms)
//    OUT=ml/dataset.jsonl  출력 파일
//    CLAUDE_MODEL      교사 모델(기본 claude-haiku-4-5). $2엔 haiku 권장.
//
//  특징: 이어하기(append) 지원 — 중단해도 다시 돌리면 목표까지 채운다.
//        rate limit / 일일 한도에 걸리면 대기 후 이어서 채운다.
// ============================================================

import fs from 'fs'
import {
  buildContents,
  generateBeat,
  SHORT_SYSTEM,
  systemInstruction,
  RESPONSE_SCHEMA,
  normalize,
} from '../src/services/geminiService.js'
import { SCENES, isEnding } from '../src/game/scenes.js'
import { createNewGame } from '../src/game/state.js'
import { NPCS, TONES, DIALOGUE_TONES, ACTION_TONES } from '../src/game/lore.js'

// SHORT_SYSTEM은 geminiService에서 import — 학습(여기)과 추론(ollamaProvider)이
// 동일한 시스템 문자열을 쓰도록 단일 출처로 관리한다.
const PROVIDER = (process.env.PROVIDER || 'claude').toLowerCase()
const TARGET = Number(process.env.TARGET || 300)
const OUT = process.env.OUT || 'ml/dataset.jsonl'

// 여러 Gemini 키 수집 → 한도 걸리면 순서대로 로테이션.
//  - 환경변수(GEMINI_API_KEY, _2, _3)
//  - 키 파일(기본 ml/key.env)의 모든 GEMINI_API_KEY 라인(같은 이름 중복도 다 수집)
//  같은 이름을 두 줄 쓰면 source로는 하나만 남으므로, 파일을 직접 파싱한다.
function collectGeminiKeys() {
  const keys = []
  for (const k of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']) {
    if (process.env[k]) keys.push(process.env[k].trim())
  }
  const KEY_FILE = process.env.KEY_FILE || 'ml/key.env'
  try {
    for (const line of fs.readFileSync(KEY_FILE, 'utf8').split('\n')) {
      const m = line.match(/^\s*GEMINI_API_KEY(?:_\d+)?\s*=\s*(.+?)\s*$/)
      if (m && m[1] && !m[1].startsWith('PASTE_')) keys.push(m[1].trim())
    }
  } catch {
    /* 파일 없어도 env로 동작 */
  }
  return [...new Set(keys)] // 중복 제거, 순서 유지
}

const GEMINI_KEYS = PROVIDER === 'gemini' ? collectGeminiKeys() : []
let keyIdx = 0 // 현재 사용 중인 Gemini 키 인덱스(한도 시 rotation)
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'
// claude는 rate limit이 넉넉해 촘촘히, gemini 무료는 느리게.
const DELAY_MS = Number(process.env.DELAY_MS || (PROVIDER === 'gemini' ? 4500 : 800))

if (PROVIDER === 'gemini' && GEMINI_KEYS.length === 0) {
  console.error('❌ PROVIDER=gemini 에는 GEMINI_API_KEY 필요(ml/key.env 또는 환경변수).')
  process.exit(1)
}
if (PROVIDER === 'claude' && !ANTHROPIC_KEY) {
  console.error('❌ PROVIDER=claude 에는 ANTHROPIC_API_KEY 필요.\n   예: PROVIDER=claude ANTHROPIC_API_KEY=sk-ant-... node ml/generate-dataset.mjs')
  process.exit(1)
}

// ---- Claude 교사: 전체 systemInstruction + tool-use로 스키마 강제 ----
// system은 매 호출 동일하므로 cache_control로 캐싱(입력 비용 ~90%↓).
// generateBeat와 같은 반환형 { ok, data, code } 을 돌려준다.
const FULL_SYSTEM = systemInstruction()
async function claudeBeat({ save, playerInput, signal }) {
  const user = buildContents(save, playerInput)[0].parts[0].text
  let resp
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        temperature: 0.9,
        // 프롬프트 캐싱: 고정된 전체 규칙 프롬프트를 프리픽스로 캐시.
        system: [{ type: 'text', text: FULL_SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
        // tool-use로 JSON 스키마를 강제 → tool_use.input 이 곧 정답 JSON.
        tools: [
          {
            name: 'emit_beat',
            description: 'Emit exactly one story beat as a structured object.',
            input_schema: RESPONSE_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: 'emit_beat' },
      }),
    })
  } catch (e) {
    return { ok: false, code: 'NETWORK', error: e?.message || 'anthropic unreachable' }
  }
  if (resp.status === 429 || resp.status === 529) return { ok: false, code: 'RATE_LIMIT', error: `HTTP ${resp.status}` }
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      msg = (await resp.json())?.error?.message || msg
    } catch {}
    return { ok: false, code: 'HTTP', error: msg }
  }
  let json
  try {
    json = await resp.json()
  } catch {
    return { ok: false, code: 'PARSE', error: 'bad envelope' }
  }
  const block = (json.content || []).find((b) => b.type === 'tool_use')
  if (!block?.input) return { ok: false, code: 'PARSE', error: 'no tool_use in response' }
  return { ok: true, data: normalize(block.input, save) }
}

// 선택된 교사. gemini는 현재 키(keyIdx)로 호출 — 한도 시 로테이션됨.
const teacher =
  PROVIDER === 'gemini'
    ? (args) => generateBeat({ apiKey: GEMINI_KEYS[keyIdx], ...args })
    : claudeBeat

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
  if (roll < 0.5) {
    // 자유 입력(짧은 한국어 대사) — 비율 상향(35%)으로 자유입력 대응력 강화
    return rand([
      '솔직히 말해줘. 이 칩이 대체 뭐지?',
      '난 여기서 나가고 싶을 뿐이야.',
      '당신을 믿어도 되나?',
      '거짓말은 그만하고 본론으로.',
      '한 발만 잘못 디디면 우리 둘 다 끝이야.',
      '넌 누구지? 왜 나한테 이걸 줬어?',
      '이 도시에서 벗어날 방법이 있긴 해?',
      '그 눈빛, 날 아는 것 같은데.',
      '원하는 게 뭐야. 돌려 말하지 마.',
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

// 연속 RATE_LIMIT이 이 횟수를 넘으면 "일일 한도(RPD)"로 판단하고 종료한다.
// (RPM은 60초 대기로 곧 풀리지만, RPD는 몇 시간 안 풀리므로 헛도는 걸 막는다.)
const MAX_RL_STREAK = Number(process.env.MAX_RL_STREAK || 15)
// 백업 키가 있을 때 이만큼 연속 한도면 다음 키로 전환(빠른 로테이션).
const ROTATE_AFTER = Number(process.env.ROTATE_AFTER || 3)

const stream = fs.createWriteStream(OUT, { flags: 'a' })
let made = existing
let fail = 0
let rlStreak = 0 // 연속 RATE_LIMIT 카운터(성공 시 리셋)
const who = PROVIDER === 'gemini' ? `gemini(무료·키 ${GEMINI_KEYS.length}개)` : `claude(${CLAUDE_MODEL})`
console.log(`▓ 교사 ${who} · 목표 ${TARGET}개 · 간격 ${DELAY_MS}ms · 출력 ${OUT}\n`)

let i = 0
while (made < TARGET) {
  const nodeId = NODES[i % NODES.length] // 노드를 골고루 순환
  i++
  const save = randomSave(nodeId)
  const playerInput = randomInput(save)

  // 게임과 동일한 user(앵커+상태). generateBeat는 내부적으로 전체 systemInstruction을
  // 써서 Gemini를 호출하지만, 학습 레코드의 system은 짧은 것으로 저장한다.
  const user = buildContents(save, playerInput)[0].parts[0].text

  const res = await teacher({ save, playerInput })
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
    rlStreak = 0 // 성공하면 연속 카운터 리셋
    if (made % 10 === 0) console.log(`  ✅ ${made}/${TARGET} (node=${nodeId})`)
  } else {
    fail++
    if (res.code === 'RATE_LIMIT') {
      rlStreak++
      const hasBackup = PROVIDER === 'gemini' && keyIdx < GEMINI_KEYS.length - 1
      // 백업 키가 있으면 몇 번만 빠르게 재시도하고 곧 전환(죽은 키에 60초씩 낭비 안 함).
      if (hasBackup && rlStreak >= ROTATE_AFTER) {
        keyIdx++
        rlStreak = 0
        console.log(`  🔄 키 #${keyIdx} 한도로 판단 → 키 #${keyIdx + 1}/${GEMINI_KEYS.length}로 전환`)
        continue
      }
      // 마지막 키(백업 없음)에서 연속 한도가 길면 일일 한도로 보고 종료.
      if (!hasBackup && rlStreak >= MAX_RL_STREAK) {
        console.log(
          `  🛑 ${GEMINI_KEYS.length > 1 ? `모든 키(${GEMINI_KEYS.length}개) ` : ''}연속 RATE_LIMIT — 일일 한도로 판단, 종료.\n` +
            `     내일 같은 명령을 다시 실행하면 ${made}개부터 이어서 채웁니다(append/resume).`,
        )
        break
      }
      const wait = hasBackup ? 8000 : 60000 // 백업 있으면 짧게, 마지막 키면 RPM 회복 위해 60초
      console.log(`  ⏳ RATE_LIMIT (${rlStreak}) [키 #${keyIdx + 1}/${GEMINI_KEYS.length}] — ${wait / 1000}초 후 재개`)
      await sleep(wait)
    } else {
      console.log(`  ⚠︎ 실패(${res.code}) — 건너뜀`)
    }
  }
  await sleep(DELAY_MS)
}

stream.end()
console.log(`\n✅ 완료: ${made}개 (신규 ${made - existing}, 실패 ${fail}). → ${OUT}`)
