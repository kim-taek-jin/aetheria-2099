// ============================================================
//  intent.js — 자유 입력을 "authoring 된 선택지"로 분류한다.
//
//  왜: 본편을 손으로 쓴 뒤에도 자유 입력만은 모델이 문장을 지어냈고,
//  그 순간 품질이 무너졌다(손으로 쓴 문단 사이에 뜻이 안 통하는 문장이 낀다).
//
//  해법은 모델을 빼는 게 아니라 **모델이 실제로 잘하는 일을 시키는 것**이다.
//  7B 모델은 한국어 산문은 못 쓰지만 의도 분류는 잘한다 — 실측 10/10.
//  그래서 자유 입력은 "무엇을 하려는가"만 판정하고, 화면에 나가는 글은
//  여전히 사람이 쓴 것을 쓴다.
//
//  반환: 0..n-1 (선택지 인덱스) | -1 (해당 없음) | null (분류 실패)
// ============================================================

import { OLLAMA_URL, OLLAMA_MODEL } from './ollamaProvider.js'
import { topicByKeyword } from '../game/answers.js'

// 톤 라벨에 실제로 쓰이는 말들 — 모델이 없을 때의 폴백 규칙.
const TONE_WORDS = {
  Honest: ['솔직', '사실', '털어', '고백', '진실', '인정'],
  Deceptive: ['거짓', '속이', '둘러', '숨기', '연기', '시치미'],
  Aggressive: ['도발', '위협', '협박', '쏘아', '쏘아붙', '화내', '들이받', '공격'],
  Investigate: ['조사', '살펴', '뒤지', '확인', '묻는다', '캐물', '읽어'],
  Hack: ['해킹', '뚫', '침투', '크랙', '회선', '단말'],
  Stealth: ['은신', '숨', '몰래', '조용히', '물러', '피한다'],
  Flee: ['도주', '도망', '튄다', '달린다', '빠져나', '벗어난'],
}

// 모델 없이 쓰는 규칙 기반 분류(오프라인·폴백).
export function classifyByKeyword(text, choices) {
  const t = String(text || '')
  let best = -1
  let bestScore = 0
  choices.forEach((c, i) => {
    const words = TONE_WORDS[c.tone] || []
    let score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    // 선택지 문구 자체와 겹치는 명사도 약하게 점수를 준다.
    const label = (c.text.match(/\]\s*(.*)$/) || [, ''])[1]
    for (const chunk of label.split(/[\s,.]+/)) {
      if (chunk.length >= 2 && t.includes(chunk)) score += 0.5
    }
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  })
  return bestScore > 0 ? best : -1
}

// 모델에 분류를 맡긴다. 숫자 하나만 받으므로 빠르고(출력 4토큰) 안정적이다.
export async function classifyIntent({ text, choices, signal, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const list = choices.map((c, i) => `${i}: ${c.text}`).join('\n')
  // -1(해당 없음) 예시를 주지 않으면 모델이 -1을 거의 쓰지 않고 아무 선택지에나
  // 억지로 매핑한다("춤을 춘다" → 거짓말). few-shot 두 줄로 실측 정확도가
  // 10/14 → 12/14로 올랐다(정상 입력 10건은 전부 정확).
  const prompt = `당신은 게임의 의도 분류기다.
플레이어의 행동이 아래 선택지 중 하나와 "같은 의도"이면 그 번호를 출력한다.
선택지들과 아무 관련도 없는 엉뚱한 행동이면 반드시 -1을 출력한다.
번호만 출력하고 다른 말은 하지 않는다.

선택지:
${list}

예시:
행동: 노래를 부르며 춤을 춘다
번호: -1
행동: 점심으로 뭘 먹을지 고민한다
번호: -1

행동: ${text}
번호:`

  try {
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      // temperature 0: 분류는 창의성이 필요 없다. num_predict 4: 숫자 하나면 된다.
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0, num_predict: 5 } }),
    })
    if (!r.ok) return null
    const raw = ((await r.json())?.response || '').trim()
    const m = raw.match(/-?\d+/)
    if (!m) return null
    const n = parseInt(m[0], 10)
    if (n === -1) return -1
    return Number.isInteger(n) && n >= 0 && n < choices.length ? n : -1
  } catch {
    return null // 네트워크·모델 실패 → 호출자가 폴백
  }
}

// 최종 판정: 모델 → 실패 시 키워드 규칙.
// useModel=false면 모델을 아예 부르지 않는다 — 웹에 배포하면 방문자에겐
// Ollama가 없어서 매 턴 localhost:11434 호출이 실패하고 콘솔에 에러가 쌓인다
// (HTTPS에선 mixed content로 차단). 없는 걸 알면 부르지 않는 게 맞다.
export async function resolveIntent({ text, choices, signal, useModel = true }) {
  if (useModel) {
    const byModel = await classifyIntent({ text, choices, signal })
    if (byModel !== null) return byModel
  }
  return classifyByKeyword(text, choices)
}

// ---- 주제 분류(질문일 때) ----
// 행동이 아니라 "무엇에 대해 묻는가"를 고른다. 답변 자체는 손으로 쓴 것을 쓴다.
const TOPIC_LABEL = {
  chip: '칩 #00이라는 물건에 대해',
  outside: '장벽 바깥 / 진짜 하늘 / 정화된 외부에 대해',
  nexus: 'NEXUS 또는 리엔이라는 존재에 대해',
  self: '지금 대화 중인 상대 자신에 대해',
  past: '제인의 지워진 3년과 정체에 대해',
  courier: '죽은 배달원에 대해',
  others: '다른 세력(렌·카엘·에코)에 대해',
}

export async function classifyTopic({ text, topics, signal, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const list = topics.map((t, i) => `${i}: ${TOPIC_LABEL[t] || t}`).join('\n')
  const prompt = `플레이어의 질문이 무엇에 대한 것인지 아래에서 하나 고른다.
어느 것도 아니면 -1을 출력한다. 번호만 출력한다.

${list}

질문: ${text}
번호:`
  try {
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0, num_predict: 5 } }),
    })
    if (!r.ok) return null
    const m = (((await r.json())?.response || '').trim().match(/-?\d+/) || [])[0]
    if (m === undefined) return null
    const n = parseInt(m, 10)
    return n >= 0 && n < topics.length ? topics[n] : null
  } catch {
    return null
  }
}

// 키워드 우선(빠르고 확실), 없으면 모델에 물어본다.
export async function resolveTopic({ text, topics, signal, useModel = true }) {
  const byKeyword = topicByKeyword(text)
  if (byKeyword) return byKeyword
  return useModel ? classifyTopic({ text, topics, signal }) : null
}

// ---- 모델이 직접 답하기(authoring 주제 밖의 질문) ----
// 손으로 쓴 답변은 7개 주제만 덮는다. 그 밖을 물으면 지금까지는 인물다운
// 회피만 나왔다. 여기서 자체 모델이 답하되, 품질 게이트를 통과한 것만 쓴다.
//
// 과제가 예전과 다르다는 점이 중요하다. 모델은 이제 나레이션·선택지·JSON을
// 만들지 않는다 — "이 인물의 목소리로 한두 문장" 하나만 하면 된다.
const ANSWER_MIN = 8
const ANSWER_MAX = 110

// 프롬프트 지시가 답변에 새어 나오는 패턴. 모델이 자기가 받은 명령을 그대로
// 뱉는 일이 잦다("…짧게만 답해", "다시 묻지 마라", "설명하지 않는다").
const INSTRUCTION_LEAK = /짧게|한 문장|한두 문장|답하라|답해라|설명하지|지어내지|따옴표|대사만|묻지 ?마라|모르면/

// 화면에 내보내도 되는 답인가. 하나라도 걸리면 쓰지 않는다.
// 구조적 결함만 잡을 수 있고 "말이 되는가"는 못 잡는다 — 그건 모델의 몫이다.
export function answerPassesGate(text, hasGarbleFn) {
  const t = String(text || '').trim()
  if (t.length < ANSWER_MIN || t.length > ANSWER_MAX) return false
  if (/[{}\[\]"]|npc_|_change|story_branch/.test(t)) return false // JSON 누출
  if (/(.)\1{3,}|[*#~`|]/.test(t)) return false // 같은 문자 반복·마크다운 기호(디코딩 붕괴 신호)
  if (/\n/.test(t)) return false // 여러 줄 = 대사가 아님
  if (INSTRUCTION_LEAK.test(t)) return false // 프롬프트 지시 누출
  if (hasGarbleFn && hasGarbleFn(t)) return false // 깨진 토큰·한자
  // 문장 수 제한 — 세 문장을 넘으면 대사가 아니라 늘어놓기다.
  const sentences = t.split(/[.!?…]+/).filter((x) => x.trim().length > 1)
  if (sentences.length > 3) return false
  const hangul = (t.match(/[가-힣]/g) || []).length
  return hangul / t.length >= 0.55
}

export async function answerWithModel({
  npc,
  voice,
  setting,
  question,
  isAction = false,
  temperature = 0.6,
  signal,
  url = OLLAMA_URL,
  model = OLLAMA_MODEL,
}) {
  // 질문이면 "답하라", 행동이면 "반응하라" — 과제를 명확히 나눠야 헛소리가 준다.
  const task = isAction
    ? `플레이어(제인)가 방금 한 행동에 ${npc}가 보일 반응을 한국어 한 문장으로만 써라.`
    : `플레이어(제인)의 질문에 ${npc}의 목소리로 한국어 한두 문장으로만 답하라.`
  const label = isAction ? '제인의 행동' : '질문'
  const prompt = `너는 사이버펑크 게임 "Aetheria 2099"의 등장인물 ${npc}이다.
${voice ? `말투: ${voice}\n` : ''}${setting ? `지금 장면: ${setting}\n` : ''}
${task}
따옴표 없이 대사만 쓴다. 설명하지 않는다. 새 설정을 지어내지 않는다.
모르면 모른다고 짧게 말한다.

${label}: ${question}
${npc}:`
  try {
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          top_p: 0.9,
          num_predict: 80,
          repeat_penalty: 1.15,
          stop: ['\n\n', '질문:', '제인의 행동:', '제인:'],
        },
      }),
    })
    if (!r.ok) return null
    return (((await r.json())?.response || '').trim().split('\n')[0] || '').trim() || null
  } catch {
    return null
  }
}

// 게이트를 통과할 때까지 최대 2번 시도한다(두 번째는 온도를 낮춰 노이즈를 줄인다).
// 끝내 실패하면 null — 호출자가 인물다운 회피로 떨어진다. 깨진 문장은 안 나간다.
export async function answerWithModelGated(opts, hasGarbleFn) {
  for (const temperature of [0.6, 0.35]) {
    const raw = await answerWithModel({ ...opts, temperature })
    if (answerPassesGate(raw, hasGarbleFn)) return raw
  }
  return null
}
