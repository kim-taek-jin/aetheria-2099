// ============================================================
//  ollamaProvider.js — 로컬 파인튜닝 모델(Ollama)로 한 비트 생성.
//
//  geminiService의 generateBeat와 "같은 시그니처/반환형"을 지켜, 게임 UI/로직을
//  건드리지 않고 프로바이더만 갈아끼울 수 있게 한다(우아한 강등/데스크톱 빌드).
//
//  학습과 동일한 SHORT_SYSTEM + 동일한 buildContents(앵커+상태)를 사용하고,
//  응답은 게임과 동일한 safeParse/normalize로 정제한다(형식 일관성).
//
//  자가 치유: 로컬 소형 모델이 퇴행 출력(반복·너무 짧음·에코)을 내면 1회 재생성.
//
//  기본 엔드포인트: http://localhost:11434 (Ollama 기본).
// ============================================================

import { SHORT_SYSTEM, RESPONSE_SCHEMA, buildContents, safeParse, normalize, isLowQuality } from './geminiService.js'

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

// 한 번의 생성 요청. stream이면 onPartial로 부분 텍스트를 흘려보낸다.
async function runOnce({ save, playerInput, signal, onPartial, url, model, temperature }) {
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
    // repeat_penalty/last_n: 직전 대사·주제 반복 루프 억제(1.3은 문장 붕괴 → 1.15 완화).
    // num_predict: 실제 JSON 길이(~350토큰)에 여유. keep_alive: 모델 상주(재로딩 방지).
    options: {
      temperature,
      top_p: 0.9,
      num_predict: 600,
      repeat_penalty: 1.15,
      repeat_last_n: 128,
    },
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

// generateBeat와 호환. apiKey 불필요(로컬).
// onPartial(선택): 스트리밍 중 부분 텍스트를 흘려보내 대기 체감을 줄인다.
// 자가 치유: 첫 결과가 퇴행(반복·에코·너무 짧음)이면 온도를 올려 1회만 재생성.
export async function generateBeat({ save, playerInput, signal, onPartial, url = OLLAMA_URL, model = OLLAMA_MODEL }) {
  const prevLine = [...(save.recentTurns || [])].reverse().find((t) => t?.line)?.line

  const first = await runOnce({ save, playerInput, signal, onPartial, url, model, temperature: 0.65 })
  if (!first.ok) return first
  if (!isLowQuality(first.data.npc_response, prevLine)) return first

  // 퇴행 감지 → 온도를 올려 다양성을 주고 1회 재생성(스트리밍 없이). 더 나으면 채택.
  const retry = await runOnce({ save, playerInput, signal, url, model, temperature: 0.85 })
  if (retry.ok && !isLowQuality(retry.data.npc_response, prevLine)) return retry
  return first // 재생성도 신통찮으면 최선의 첫 결과 유지
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
