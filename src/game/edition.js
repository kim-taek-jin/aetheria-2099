// ============================================================
//  edition.js — 체험판 / 정식판.
//
//  같은 코드에서 빌드 모드로 갈린다(`npm run build:demo`).
//  체험판은 프롤로그 → 1막 → 렌 루트 → 3막 → 결말까지 온전히 한 판이 된다.
//  카엘·에코 루트는 분기에서 "잠긴 선택지"로 보인다 — 숨기지 않는다.
//  보이지만 갈 수 없는 길이, 그리고 결말 화면의 "다른 길에 남은 잔향"이
//  정식판으로 가는 이유가 된다.
//
//  잠금은 클라이언트 판정이다. 웹 체험판의 번들에는 정식판 본문이 그대로
//  들어 있으므로, 이 장치는 "판매용 잠금"이지 "콘텐츠 보호"가 아니다.
// ============================================================

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

export const IS_DEMO = env.VITE_EDITION === 'demo'
// 정식판 판매 페이지(itch.io / 스토브 등). 비어 있으면 "곧 공개"로 표시한다.
export const STORE_URL = env.VITE_STORE_URL || ''

// 체험판에서 막는 루트. 렌 루트를 여는 이유: 모든 플레이어가 1막에서 이미
// 렌을 만나므로 이어지는 흐름이 가장 자연스럽고, 장부(잔향 #1)가 있어
// "잔향이 무엇인지"를 체험판 안에서 한 번 겪어볼 수 있다.
export const LOCKED_ROUTES = {
  Kael: { prefix: 'ACT2_KAEL_', label: '카엘의 길' },
  Echo: { prefix: 'ACT2_ECHO_', label: '에코의 길' },
}

export function isLockedNode(nodeId, demo = IS_DEMO) {
  if (!demo || !nodeId) return false
  return Object.values(LOCKED_ROUTES).some((r) => nodeId.startsWith(r.prefix))
}

// 선택지 중 잠긴 루트로 가는 것에 표시를 붙인다(숨기지 않는다).
export function markLockedChoices(choices, demo = IS_DEMO) {
  if (!demo || !Array.isArray(choices)) return choices
  return choices.map((c) => (isLockedNode(c.branch, demo) ? { ...c, locked: true } : c))
}
