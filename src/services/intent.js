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
import { MODEL_ID as GEMINI_MODEL } from './geminiService.js'
import { topicByKeyword } from '../game/answers.js'

// ---- 백엔드: 내 모델(Ollama) 또는 플레이어의 Gemini 키 ----
// 분류·답변 모두 "프롬프트 → 짧은 텍스트"라서 백엔드만 바꾸면 된다.
// 웹(itch.io 등)에서는 방문자에게 Ollama가 없으므로, 키가 있으면 Gemini가
// 내 모델이 하던 일을 그대로 넘겨받는다. 품질 게이트는 똑같이 거친다.
//   backend: { kind: 'ollama' } | { kind: 'gemini', apiKey }
const OLLAMA = { kind: 'ollama' }

export async function complete({ prompt, temperature = 0, maxTokens = 5, stop, topP, repeatPenalty, signal, backend = OLLAMA, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  try {
    if (backend.kind === 'gemini') {
      if (!backend.apiKey) return null
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(backend.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              ...(topP ? { topP } : {}),
              // Flash는 출력 전에 "생각" 토큰을 쓸 수 있고 그것도 이 한도에 포함된다.
              // 숫자 하나를 받을 때도 여유를 둬야 빈 응답이 안 나온다.
              maxOutputTokens: Math.max(512, maxTokens * 8),
              ...(stop?.length ? { stopSequences: stop.slice(0, 5) } : {}),
            },
          }),
        },
      )
      if (!r.ok) return null
      const parts = (await r.json())?.candidates?.[0]?.content?.parts || []
      // 생각(thought) 파트는 건너뛰고 실제 출력만 모은다.
      return parts.filter((x) => !x.thought).map((x) => x.text || '').join('').trim()
    }
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
          num_predict: maxTokens,
          ...(topP ? { top_p: topP } : {}),
          ...(repeatPenalty ? { repeat_penalty: repeatPenalty } : {}),
          ...(stop ? { stop } : {}),
        },
      }),
    })
    if (!r.ok) return null
    return ((await r.json())?.response || '').trim()
  } catch {
    return null // 네트워크·모델 실패 → 호출자가 폴백
  }
}

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

// 영어 입력용. 단어 단위로 맞춘다("run"이 "brunch"에 걸리지 않게).
const TONE_WORDS_EN = {
  Honest: ['honest', 'truth', 'confess', 'admit', 'tell the truth', 'come clean', 'level with'],
  Deceptive: ['lie', 'deceive', 'bluff', 'pretend', 'trick', 'fake', 'make up', 'mislead'],
  Aggressive: ['threaten', 'provoke', 'insult', 'attack', 'punch', 'yell', 'mock', 'taunt', 'challenge'],
  Investigate: ['investigate', 'look', 'search', 'examine', 'check', 'inspect', 'read', 'ask', 'study'],
  Hack: ['hack', 'breach', 'crack', 'jack in', 'override', 'decrypt'],
  Stealth: ['hide', 'sneak', 'quietly', 'slip', 'back away', 'stay low', 'stealth'],
  Flee: ['run', 'flee', 'escape', 'bolt', 'get out', 'leave'],
}
const wordHit = (t, w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(t)

// 모델 없이 쓰는 규칙 기반 분류(오프라인·폴백).
export function classifyByKeyword(text, choices) {
  const t = String(text || '')
  let best = -1
  let bestScore = 0
  choices.forEach((c, i) => {
    const words = TONE_WORDS[c.tone] || []
    let score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    score += (TONE_WORDS_EN[c.tone] || []).reduce((n, w) => n + (wordHit(t, w) ? 1 : 0), 0)
    // 선택지 문구 자체와 겹치는 명사도 약하게 점수를 준다.
    const label = (c.text.match(/\]\s*(.*)$/) || [, ''])[1]
    for (const chunk of label.split(/[\s,.]+/)) {
      // 영어 라벨의 관사·전치사가 점수를 주지 않게 3글자 이상, 대소문자 무시.
      const latin = /^[a-z']+$/i.test(chunk)
      if (latin ? chunk.length >= 4 && wordHit(t, chunk.toLowerCase()) : chunk.length >= 2 && t.includes(chunk)) score += 0.5
    }
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  })
  return bestScore > 0 ? best : -1
}

// 모델에 분류를 맡긴다. 숫자 하나만 받으므로 빠르고(출력 4토큰) 안정적이다.
export async function classifyIntent({ text, choices, signal, backend, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
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

  // temperature 0: 분류는 창의성이 필요 없다. 숫자 하나면 된다.
  const raw = await complete({ prompt, temperature: 0, maxTokens: 5, signal, backend, url, model })
  if (raw === null) return null
  const m = raw.match(/-?\d+/)
  if (!m) return null
  const n = parseInt(m[0], 10)
  if (n === -1) return -1
  return Number.isInteger(n) && n >= 0 && n < choices.length ? n : -1
}

// 최종 판정: 모델 → 실패 시 키워드 규칙.
// useModel=false면 모델을 아예 부르지 않는다 — 웹에 배포하면 방문자에겐
// Ollama가 없어서 매 턴 localhost:11434 호출이 실패하고 콘솔에 에러가 쌓인다
// (HTTPS에선 mixed content로 차단). 없는 걸 알면 부르지 않는 게 맞다.
export async function resolveIntent({ text, choices, signal, useModel = true, backend }) {
  if (useModel) {
    const byModel = await classifyIntent({ text, choices, signal, backend })
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

export async function classifyTopic({ text, topics, signal, backend, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const list = topics.map((t, i) => `${i}: ${TOPIC_LABEL[t] || t}`).join('\n')
  const prompt = `플레이어의 질문이 무엇에 대한 것인지 아래에서 하나 고른다.
어느 것도 아니면 -1을 출력한다. 번호만 출력한다.

${list}

질문: ${text}
번호:`
  const raw = await complete({ prompt, temperature: 0, maxTokens: 5, signal, backend, url, model })
  const m = ((raw || '').match(/-?\d+/) || [])[0]
  if (m === undefined) return null
  const n = parseInt(m, 10)
  return n >= 0 && n < topics.length ? topics[n] : null
}

// 키워드 우선(빠르고 확실), 없으면 모델에 물어본다.
export async function resolveTopic({ text, topics, signal, useModel = true, backend }) {
  const byKeyword = topicByKeyword(text)
  if (byKeyword) return byKeyword
  return useModel ? classifyTopic({ text, topics, signal, backend }) : null
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
const INSTRUCTION_LEAK_EN = /one sentence|two sentences|answer briefly|in character|do not explain|don't explain|no quotes|dialogue only|don't make up|do not invent|as an ai|if you don't know/i

// 화면에 내보내도 되는 답인가. 하나라도 걸리면 쓰지 않는다.
// 구조적 결함만 잡을 수 있고 "말이 되는가"는 못 잡는다 — 그건 모델의 몫이다.
export function answerPassesGate(text, hasGarbleFn, lang = 'ko') {
  const t = String(text || '').trim()
  if (lang === 'en') return englishAnswerPasses(t)
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

// 영어 답의 게이트. 한국어용 hasGarble은 쓰지 않는다 — 그건 "한국어 문장 속
// 영어 조각"을 깨짐으로 보는 규칙이라 영어 답 전체를 떨어뜨린다.
function englishAnswerPasses(t) {
  if (t.length < 8 || t.length > 240) return false
  if (/[{}\[\]"]|npc_|_change|story_branch/.test(t)) return false
  if (/(.)\1{3,}|[*#~`|]/.test(t)) return false
  if (/\n/.test(t)) return false
  if (INSTRUCTION_LEAK_EN.test(t)) return false
  if (/[가-힣㐀-䶿一-鿿]/.test(t)) return false // 한글·한자가 섞이면 실패
  const sentences = t.split(/[.!?…]+/).filter((x) => x.trim().length > 1)
  if (sentences.length > 3) return false
  const latin = (t.match(/[A-Za-z]/g) || []).length
  return latin / t.length >= 0.6
}

export async function answerWithModel({
  npc,
  voice,
  setting,
  question,
  isAction = false,
  lang = 'ko',
  temperature = 0.6,
  signal,
  backend,
  url = OLLAMA_URL,
  model = OLLAMA_MODEL,
}) {
  // 질문이면 "답하라", 행동이면 "반응하라" — 과제를 명확히 나눠야 헛소리가 준다.
  const task = isAction
    ? `플레이어(제인)가 방금 한 행동에 ${npc}가 보일 반응을 한국어 한 문장으로만 써라.`
    : `플레이어(제인)의 질문에 ${npc}의 목소리로 한국어 한두 문장으로만 답하라.`
  const label = isAction ? '제인의 행동' : '질문'
  const prompt =
    lang === 'en'
      ? `You are ${npc}, a character in the cyberpunk game "Aetheria 2099".
${voice ? `Voice (in Korean, keep the attitude): ${voice}\n` : ''}${setting ? `Current scene (in Korean): ${setting}\n` : ''}
${isAction ? `Write ${npc}'s reaction to what Jayne just did, in ONE English sentence.` : `Answer Jayne's question in ${npc}'s voice, in one or two English sentences.`}
Write only the spoken line, no quotation marks, no narration. Do not invent new lore.

${isAction ? "Jayne's action" : 'Question'}: ${question}
${npc}:`
      : `너는 사이버펑크 게임 "Aetheria 2099"의 등장인물 ${npc}이다.
${voice ? `말투: ${voice}\n` : ''}${setting ? `지금 장면: ${setting}\n` : ''}
${task}
따옴표 없이 대사만 쓴다. 설명하지 않는다. 새 설정을 지어내지 않는다.
모르면 모른다고 짧게 말한다.

${label}: ${question}
${npc}:`
  const raw = await complete({
    prompt,
    temperature,
    topP: 0.9,
    maxTokens: 80,
    repeatPenalty: 1.15,
    stop: lang === 'en' ? ['\n\n', 'Question:', "Jayne's action:", 'Jayne:'] : ['\n\n', '질문:', '제인의 행동:', '제인:'],
    signal,
    backend,
    url,
    model,
  })
  return ((raw || '').split('\n')[0] || '').trim() || null
}

// 게이트를 통과할 때까지 최대 2번 시도한다(두 번째는 온도를 낮춰 노이즈를 줄인다).
// 끝내 실패하면 null — 호출자가 인물다운 회피로 떨어진다. 깨진 문장은 안 나간다.
export async function answerWithModelGated(opts, hasGarbleFn) {
  for (const temperature of [0.6, 0.35]) {
    const raw = await answerWithModel({ ...opts, temperature })
    if (answerPassesGate(raw, hasGarbleFn, opts.lang)) return raw
  }
  return null
}
