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

// 부분 JSON 버퍼에서 문자열 필드 값을 관대하게 뽑아낸다(스트리밍 중 값이 자라도 안전).
// 닫는 따옴표가 아직 안 왔으면 지금까지 받은 만큼만 반환.
function extractPartialString(buf, key) {
  const m = buf.match(new RegExp(`"${key}"\\s*:\\s*"`))
  if (!m) return ''
  let out = ''
  for (let i = m.index + m[0].length; i < buf.length; i++) {
    const c = buf[i]
    if (c === '\\') {
      const n = buf[i + 1]
      out += n === 'n' ? '\n' : n === 't' ? '\t' : n || ''
      i++
    } else if (c === '"') break
    else out += c
  }
  return out
}

// generateBeat와 호환. apiKey 불필요(로컬).
// onPartial(선택): 스트리밍 중 {narration, npc_name, npc_response}가 자랄 때마다 호출 →
// UI가 생성되는 대로 글자를 흘려보내 대기 체감을 줄인다(총 시간은 같아도 첫 글자가 빨리 뜸).
export async function generateBeat({ save, playerInput, signal, onPartial, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const user = buildContents(save, playerInput)[0].parts[0].text
  const stream = typeof onPartial === 'function'
  const body = {
    model,
    messages: [
      { role: 'system', content: SHORT_SYSTEM },
      { role: 'user', content: user },
    ],
    stream,
    // Ollama 구조화 출력: 스키마로 디코딩을 제약해 유효 JSON을 강제(소형 모델 방어).
    format: RESPONSE_SCHEMA,
    // 온도가 높으면 문장이 늘어지고 흐트러진다 → 0.65로 낮춰 간결·일관성↑.
    // num_predict는 실제 JSON 길이(~350토큰)에 여유를 둔 상한 — 낮출수록 장황 응답의
    // 최악 지연이 줄어든다. keep_alive로 모델을 메모리에 상주시켜 재로딩 지연 방지.
    options: { temperature: 0.65, top_p: 0.9, num_predict: 600 },
    keep_alive: '30m',
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

  let raw = ''
  if (stream && resp.body) {
    // NDJSON 스트림: 줄마다 {message:{content: <토큰>}}. 누적하며 필드를 추출해 흘려보낸다.
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let tail = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      tail += decoder.decode(value, { stream: true })
      const lines = tail.split('\n')
      tail = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const j = JSON.parse(line)
          if (j?.message?.content) raw += j.message.content
        } catch {
          /* 부분 줄 — 무시(다음 청크에서 완성) */
        }
      }
      onPartial({
        narration: extractPartialString(raw, 'narration'),
        npc_name: extractPartialString(raw, 'npc_name'),
        npc_response: extractPartialString(raw, 'npc_response'),
      })
    }
  } else {
    let json
    try {
      json = await resp.json()
    } catch {
      return { ok: false, code: 'PARSE', error: 'bad envelope' }
    }
    raw = json?.message?.content
  }

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
