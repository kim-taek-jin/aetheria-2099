// state.js — 상태머신 순수 로직 테스트.
// 게이지 클램프, trade-off 파급, heat 클라이언트 baseline, 페이싱,
// 조각 중복 제거, 플래그 병합, 두 갈래 실패 조건, 엔딩 감지, 게이팅, 직렬화.
import { describe, it, expect } from 'vitest'
import {
  createNewGame,
  applyResponse,
  gateFlags,
  serialize,
  deserialize,
  clamp,
  GATES,
  FAIL_SUSPICION,
  HEAT_MAX,
  SAVE_VERSION,
} from '../src/game/state.js'

// 최소 유효 응답(스키마 통과분만).
const beat = (o = {}) => ({
  npc_name: 'Ren',
  suspicion_change: 0,
  affinity_change: 0,
  heat_change: 0,
  story_branch: 'PROLOGUE_RAIN_01',
  background_tone: 'Normal',
  ...o,
})

describe('clamp', () => {
  it('경계를 넘지 않는다', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('createNewGame', () => {
  it('버전과 시작 상태 불변식', () => {
    const s = createNewGame()
    expect(s.version).toBe(SAVE_VERSION)
    expect(s.currentNode).toBe('PROLOGUE_RAIN_01')
    expect(s.heat).toBe(0)
    expect(Object.keys(s.relationships)).toEqual(['Ren', 'Kael', 'Echo', 'NEXUS'])
    expect(s.fragments).toEqual([])
    expect(s.failed).toBeNull()
  })
  it('불변(순수) — 원본을 건드리지 않는다', () => {
    const s = createNewGame()
    const before = serialize(s)
    applyResponse(s, beat({ suspicion_change: 5 }), '개시')
    expect(serialize(s)).toBe(before)
  })
})

describe('applyResponse — 게이지', () => {
  it('활성 NPC 게이지에 변화를 적용하고 0..100으로 클램프', () => {
    const s = createNewGame() // Ren suspicion 10, affinity 10
    const n = applyResponse(s, beat({ suspicion_change: 5, affinity_change: 200 }), 'x')
    expect(n.relationships.Ren.suspicion).toBe(15)
    // 200 → +10 클램프 → 세력 호감 가속(×1.6, 최대 +12) → 10 + 12 = 22
    expect(n.relationships.Ren.affinity).toBe(22)
  })
  it('npc_name이 무효면 activeNpc로 폴백', () => {
    const s = createNewGame()
    s.activeNpc = 'Kael'
    const n = applyResponse(s, beat({ npc_name: '없는놈', suspicion_change: 4 }), 'x')
    expect(n.relationships.Kael.suspicion).toBe(24)
  })
})

describe('applyResponse — trade-off 파급', () => {
  it('호감을 얻으면 라이벌 의심이 오른다(Ren→Echo)', () => {
    const s = createNewGame() // Echo suspicion 15
    const n = applyResponse(s, beat({ npc_name: 'Ren', affinity_change: 5 }), 'x')
    expect(n.relationships.Echo.suspicion).toBe(18)
  })
  it('공격적 입력이면 라이벌 호감이 내린다', () => {
    const s = createNewGame() // Echo affinity 10
    const n = applyResponse(s, beat({ npc_name: 'Ren' }), '위협한다')
    expect(n.relationships.Echo.affinity).toBe(8)
  })
})

describe('applyResponse — heat(추적도) 클라이언트 baseline', () => {
  it('눈에 띄는 행동은 heat를 추가로 올린다', () => {
    const s = createNewGame() // heat 0
    const n = applyResponse(s, beat({ heat_change: 0 }), '해킹으로 침투')
    expect(n.heat).toBe(4) // 눈에 띄는 행동 baseline +4
  })
  it('잠행은 heat를 내리고 0에서 멈춘다', () => {
    const s = createNewGame()
    const n = applyResponse(s, beat({ heat_change: 0 }), '은신한다')
    expect(n.heat).toBe(0)
  })
})

describe('applyResponse — 페이싱', () => {
  it('같은 노드면 turnsOnNode 증가', () => {
    const s = createNewGame()
    s.turnsOnNode = 2
    const n = applyResponse(s, beat({ story_branch: 'PROLOGUE_RAIN_01' }), 'x')
    expect(n.turnsOnNode).toBe(3)
    expect(n.turnCount).toBe(1)
  })
  it('노드가 바뀌면 turnsOnNode는 0으로 리셋', () => {
    const s = createNewGame()
    s.turnsOnNode = 5
    const n = applyResponse(s, beat({ story_branch: 'PROLOGUE_CHOICE_01' }), 'x')
    expect(n.currentNode).toBe('PROLOGUE_CHOICE_01')
    expect(n.turnsOnNode).toBe(0)
  })
})

describe('applyResponse — 조각/플래그', () => {
  it('새 조각을 추가하되 중복은 제거(trim 기준)', () => {
    const s = createNewGame()
    s.fragments = ['기존']
    const n = applyResponse(s, beat({ new_fragments: ['기존', '새 조각', ' 새 조각 '] }), 'x')
    expect(n.fragments).toEqual(['기존', '새 조각'])
  })
  it('set_flags를 true로 병합', () => {
    const s = createNewGame()
    const n = applyResponse(s, beat({ set_flags: ['kael_gave_bypass_key', 'chip00_leaked'] }), 'x')
    expect(n.flags.kael_gave_bypass_key).toBe(true)
    expect(n.flags.chip00_leaked).toBe(true)
  })
})

describe('applyResponse — 실패 두 갈래', () => {
  it('인간 세력 의심 100 → SUSPICION 실패', () => {
    const s = createNewGame()
    s.relationships.Ren.suspicion = 95
    const n = applyResponse(s, beat({ npc_name: 'Ren', suspicion_change: 10 }), 'x')
    expect(n.relationships.Ren.suspicion).toBe(FAIL_SUSPICION)
    expect(n.failed).toEqual({ npc: 'Ren', reason: 'SUSPICION' })
  })
  it('NEXUS 추적도 100 → TRACE 실패', () => {
    const s = createNewGame()
    s.heat = 95
    const n = applyResponse(s, beat({ npc_name: 'Ren', heat_change: 10 }), 'x')
    expect(n.heat).toBe(HEAT_MAX)
    expect(n.failed).toEqual({ npc: 'NEXUS', reason: 'TRACE' })
  })
  it('엔딩에 도달하면 실패로 떨어지지 않는다', () => {
    const s = createNewGame()
    s.heat = 95
    const n = applyResponse(s, beat({ story_branch: 'ENDING_SOLO_EXIT', heat_change: 10 }), 'x')
    expect(n.endingReached).toBe('ENDING_SOLO_EXIT')
    expect(n.failed).toBeNull()
  })
})

describe('gateFlags', () => {
  it('의심 임계 이상이면 hostile', () => {
    const s = createNewGame()
    s.activeNpc = 'Ren'
    s.relationships.Ren.suspicion = GATES.SUSPICION_HOSTILE
    expect(gateFlags(s).hostile).toBe(true)
  })
  it('호감 임계 이상이면 trusted', () => {
    const s = createNewGame()
    s.activeNpc = 'Ren'
    s.relationships.Ren.affinity = GATES.AFFINITY_TRUST
    expect(gateFlags(s).trusted).toBe(true)
  })
})

describe('serialize / deserialize', () => {
  it('왕복 후 동일', () => {
    const s = createNewGame()
    expect(deserialize(serialize(s))).toEqual(s)
  })
  it('버전 불일치는 null', () => {
    const s = createNewGame()
    const bad = JSON.parse(serialize(s))
    bad.version = 999
    expect(deserialize(JSON.stringify(bad))).toBeNull()
  })
  it('깨진 JSON은 null', () => {
    expect(deserialize('{not json')).toBeNull()
  })
})
