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
export async function resolveIntent({ text, choices, signal }) {
  const byModel = await classifyIntent({ text, choices, signal })
  if (byModel !== null) return byModel
  return classifyByKeyword(text, choices)
}
