// ============================================================
//  콘텐츠 그래프 검증기
//
//  실행:  node scripts/validate-content.mjs   (실패 시 exit 1 → CI에서 활용)
//
//  이 게임의 스토리는 "방향 그래프(directed graph)"다.
//    - 노드(정점) = 씬 ID           →  Object.keys(SCENES)
//    - 간선(방향) = next 배열        →  SCENES[id].next  (인접 리스트)
//
//  아래 검사들은 그 그래프가 구조적으로 온전한지 알고리즘으로 확인한다.
// ============================================================

import { SCENES } from '../src/game/scenes.js'
import { STORY_NODES, NPCS, TONES } from '../src/game/lore.js'

const START = 'PROLOGUE_RAIN_01' // 그래프의 시작 노드
const allIds = Object.keys(SCENES)
const isEnding = (id) => !!SCENES[id]?.ending

// ------------------------------------------------------------
// 공용 헬퍼: START에서 도달 가능한 노드 집합을 BFS로 계산.
//
// BFS(너비 우선 탐색): 큐(선입선출)에 시작 노드를 넣고, 꺼낼 때마다
// 그 노드의 이웃(next)을 큐에 넣는다. 이미 방문한 노드는 다시 넣지 않는다
// (visited 집합). 큐가 빌 때까지 반복하면 "닿을 수 있는 모든 노드"가 모인다.
// ------------------------------------------------------------
function reachableFrom(start) {
  const visited = new Set()
  const queue = [start]
  visited.add(start)
  while (queue.length > 0) {
    const id = queue.shift() // 큐의 앞에서 하나 꺼냄 (FIFO)
    const next = SCENES[id]?.next || []
    for (const target of next) {
      if (!SCENES[target]) continue // 없는 노드는 M1이 따로 잡는다
      if (!visited.has(target)) {
        visited.add(target)
        queue.push(target) // 뒤에 추가
      }
    }
  }
  return visited
}
const REACHABLE = reachableFrom(START)

// ------------------------------------------------------------
// M1. 참조 무결성 — 모든 next 대상이 실제로 존재하는 씬인가?
//     (간선의 도착점이 노드 집합 안에 있는가)
// ------------------------------------------------------------
function checkReferentialIntegrity() {
  const problems = []
  for (const [id, scene] of Object.entries(SCENES)) {
    for (const target of scene.next || []) {
      if (!SCENES[target]) problems.push(`${id} → ${target} (존재하지 않는 씬을 가리킴)`)
    }
  }
  return problems
}

// ------------------------------------------------------------
// M2. 도달 가능성 — START에서 모든 씬에 닿는가?
//     REACHABLE(BFS 결과)에 없는 노드 = 고아(orphan). 플레이 중 절대 안 나옴.
// ------------------------------------------------------------
function checkReachability() {
  return allIds.filter((id) => !REACHABLE.has(id)).map((id) => `${id} (START에서 도달 불가 — 고아 노드)`)
}

// ------------------------------------------------------------
// M3. 막다른 길 — 엔딩이 아닌데 next가 비어 있는 씬(진출차수 0)?
//     이런 노드에 도착하면 플레이어가 더 진행할 수 없다.
// ------------------------------------------------------------
function checkDeadEnds() {
  const problems = []
  for (const [id, scene] of Object.entries(SCENES)) {
    if (isEnding(id)) continue // 엔딩은 next가 비는 게 정상
    if (!scene.next || scene.next.length === 0) problems.push(`${id} (엔딩이 아닌데 다음 노드가 없음 — 막다른 길)`)
  }
  return problems
}

// ------------------------------------------------------------
// M4. 엔딩 도달성 — 모든 ENDING_* 씬이 START에서 도달 가능한가?
// ------------------------------------------------------------
function checkEndingsReachable() {
  return allIds
    .filter(isEnding)
    .filter((id) => !REACHABLE.has(id))
    .map((id) => `${id} (도달 불가능한 엔딩)`)
}

// ------------------------------------------------------------
// M5. 화이트리스트 일치 — STORY_NODES(AI에 허용된 노드 목록)와
//     SCENES(실제 정의)가 정확히 일치하는가? 한쪽에만 있으면 버그.
//     (Set 차집합)
// ------------------------------------------------------------
function checkWhitelistConsistency() {
  const problems = []
  const whitelist = new Set(STORY_NODES)
  const scenes = new Set(allIds)
  for (const id of scenes) if (!whitelist.has(id)) problems.push(`${id} (SCENES엔 있는데 STORY_NODES 화이트리스트에 없음)`)
  for (const id of whitelist) if (!scenes.has(id)) problems.push(`${id} (화이트리스트엔 있는데 SCENES 정의가 없음)`)
  return problems
}

// ------------------------------------------------------------
// M6. enum 유효성 — 각 씬의 npc/tone 값이 허용된 집합 안에 있는가?
// ------------------------------------------------------------
function checkEnums() {
  const problems = []
  for (const [id, scene] of Object.entries(SCENES)) {
    if (scene.npc && !NPCS.includes(scene.npc)) problems.push(`${id} (알 수 없는 npc: "${scene.npc}")`)
    if (scene.tone && !TONES.includes(scene.tone)) problems.push(`${id} (알 수 없는 tone: "${scene.tone}")`)
  }
  return problems
}

// ------------------------------------------------------------
// 리포트 러너
// ------------------------------------------------------------
const checks = [
  ['M1 참조 무결성', checkReferentialIntegrity],
  ['M2 도달 가능성', checkReachability],
  ['M3 막다른 길', checkDeadEnds],
  ['M4 엔딩 도달성', checkEndingsReachable],
  ['M5 화이트리스트 일치', checkWhitelistConsistency],
  ['M6 enum 유효성', checkEnums],
]

let total = 0
console.log(`\n▓ 콘텐츠 그래프 검증 — 노드 ${allIds.length}개, 화이트리스트 ${STORY_NODES.length}개, 도달가능 ${REACHABLE.size}개\n`)
for (const [name, fn] of checks) {
  const problems = fn() || []
  total += problems.length
  if (problems.length === 0) {
    console.log(`  ✅ ${name}: 통과`)
  } else {
    console.log(`  ❌ ${name}: ${problems.length}건`)
    for (const p of problems) console.log(`       - ${p}`)
  }
}
console.log(`\n${total === 0 ? '✅ 전체 통과' : `❌ 총 ${total}건의 문제`}\n`)
process.exit(total === 0 ? 0 : 1)
