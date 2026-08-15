// ============================================================
//  결말 수집(collection) — 여러 번의 플레이에 걸쳐 "발견한 엔딩"을 기록.
//
//  브랜칭 인터랙티브 픽션의 핵심 재미 루프는 "완성(컬렉션)"이다:
//  6개 중 몇 개를 봤는지 눈에 보이면 다른 결말을 찾으러 다시 하게 된다.
//  세이브(1회차 상태)와 분리된 별도 LocalStorage 키에 영구 저장한다.
// ============================================================

export const COLLECTION_KEY = 'aetheria2099.endings.v1'

// 갤러리 순서 + 시길(EndingScreen의 시각 아이덴티티와 일치). 제목은 렌더 시 SCENES에서.
export const ALL_ENDINGS = [
  { id: 'ENDING_REN_MONOPOLY', sigil: '⬡' },
  { id: 'ENDING_KAEL_SILENCE', sigil: '▤' },
  { id: 'ENDING_ECHO_BREAKOUT', sigil: '✕' },
  { id: 'ENDING_NEXUS_TRUST', sigil: '❋', hidden: true },
  { id: 'ENDING_JAYNE_ORIGIN', sigil: '❖', hidden: true },
  { id: 'ENDING_SOLO_EXIT', sigil: '➤' },
]
export const ENDING_COUNT = ALL_ENDINGS.length

// 순수: 발견 목록에 엔딩 id를 병합하고 "이번에 새로 발견했는지"를 함께 반환.
// (LocalStorage와 분리해 테스트 가능하게 둔다.)
export function mergeDiscovered(existing, id) {
  const set = new Set(Array.isArray(existing) ? existing.filter((x) => typeof x === 'string') : [])
  const isNew = !!id && !set.has(id)
  if (isNew) set.add(id)
  return { discovered: [...set], isNew }
}

// LocalStorage에서 발견 목록을 읽는다(깨졌으면 빈 배열).
export function getDiscovered() {
  try {
    const arr = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]')
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

// 도달한 엔딩을 기록하고 { discovered, isNew }를 반환(새로울 때만 기록).
export function recordEnding(id) {
  const merged = mergeDiscovered(getDiscovered(), id)
  if (merged.isNew) {
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(merged.discovered))
    } catch {
      /* 저장 실패해도 이번 세션 표시는 유지 */
    }
  }
  return merged
}
