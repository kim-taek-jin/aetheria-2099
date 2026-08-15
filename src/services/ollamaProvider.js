// ============================================================
//  ollamaProvider.js — 로컬 파인튜닝 모델(Ollama)로 한 비트 생성.
//
//  geminiService의 generateBeat와 "같은 시그니처/반환형"을 지켜, 게임 UI/로직을
//  건드리지 않고 프로바이더만 갈아끼울 수 있게 한다(우아한 강등/데스크톱 빌드).
//
//  학습과 동일한 SHORT_SYSTEM + 동일한 buildContents(앵커+상태)를 사용하고,
//  응답은 게임과 동일한 safeParse/normalize로 정제한다(형식 일관성).
//
//  기본 엔드포인트: http://localhost:11434 (Ollama 기본).
// ============================================================

import { SHORT_SYSTEM, RESPONSE_SCHEMA, buildContents, safeParse, normalize } from './geminiService.js'

export const OLLAMA_URL = 'http://localhost:11434'
export const OLLAMA_MODEL = 'aetheria' // `ollama create aetheria -f Modelfile` 로 등록한 이름

// generateBeat와 호환. apiKey 불필요(로컬).
export async function generateBeat({ save, playerInput, signal, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const user = buildContents(save, playerInput)[0].parts[0].text
  const body = {
    model,
    messages: [
      { role: 'system', content: SHORT_SYSTEM },
      { role: 'user', content: user },
    ],
    stream: false,
    // Ollama 구조화 출력: 스키마로 디코딩을 제약해 유효 JSON을 강제(소형 모델 방어).
    format: RESPONSE_SCHEMA,
    // 소형 3B는 온도가 높으면 문장이 늘어지고 흐트러진다 → 0.65로 낮춰 간결·일관성↑.
    options: { temperature: 0.65, top_p: 0.9, num_predict: 900 },
  }

  let resp
  try {
    resp = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    return { ok: false, code: 'NETWORK', error: e?.message || 'ollama unreachable' }
  }
  if (!resp.ok) return { ok: false, code: 'HTTP', error: `Ollama HTTP ${resp.status}` }

  let json
  try {
    json = await resp.json()
  } catch {
    return { ok: false, code: 'PARSE', error: 'bad envelope' }
  }
  const raw = json?.message?.content
  const parsed = safeParse(raw)
  if (!parsed) return { ok: false, code: 'PARSE', error: 'model returned non-JSON' }

  return { ok: true, data: normalize(parsed, save) }
}

// 로컬 Ollama가 살아있고 모델이 있는지 확인(프로바이더 선택에 사용).
export async function isAvailable(url = OLLAMA_URL, model = OLLAMA_MODEL) {
  try {
    const r = await fetch(`${url}/api/tags`)
    if (!r.ok) return false
    const j = await r.json()
    return (j?.models || []).some((m) => (m.name || '').startsWith(model))
  } catch {
    return false
  }
}
