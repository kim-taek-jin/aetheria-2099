// ============================================================
//  aiRouter — 하이브리드 프로바이더 라우터.
//
//  우선순위: BYOK 키가 있으면 클라우드(Gemini), 없으면 로컬 자체모델.
//  그리고 "복원력(resilience)": 클라우드가 일시적 오류(무료 티어 rate limit 등)로
//  막히면, 로컬 모델이 떠 있을 때 거기로 자동 전환해 플레이가 끊기지 않게 한다.
//
//  프로바이더 함수(gemini/local)를 주입받아 순수하게 동작 → 유닛 테스트 가능.
//  반환: { res, via } — via ∈ 'cloud' | 'local' | 'local-fallback'.
// ============================================================

// 로컬로 폴백할 만한 "일시적" 실패 코드(키 자체가 틀린 건 제외 — 키 수정 유도해야 함).
export function isTransient(code) {
  return code === 'RATE_LIMIT' || code === 'HTTP' || code === 'NETWORK' || code === 'PARSE'
}

export async function routeBeat({ apiKey, ollamaOn, save, playerInput, signal, gemini, local, onPartial }) {
  const via = apiKey ? 'cloud' : 'local'
  // onPartial(스트리밍)은 로컬 프로바이더만 지원 — 클라우드 경로엔 넘기지 않는다.
  const primary = apiKey
    ? await gemini({ apiKey, save, playerInput, signal })
    : await local({ save, playerInput, signal, onPartial })

  if (primary.ok) return { res: primary, via }

  // 클라우드가 일시적으로 막혔고 로컬 모델이 있으면 → 로컬로 이어간다.
  if (apiKey && ollamaOn && isTransient(primary.code)) {
    const fallback = await local({ save, playerInput, signal, onPartial })
    if (fallback.ok) return { res: fallback, via: 'local-fallback' }
  }

  // 폴백도 없거나 실패 → 원래 실패를 그대로 반환(비상 비트는 호출부에서 처리).
  return { res: primary, via }
}
