// scenes.js — 결정론적 엔딩 게이트(eligibleEndings) 테스트.
// 시스템(호감/의심/추적/조각)이 "열리는 엔딩"을 실제로 결정하는지 검증.
import { describe, it, expect } from 'vitest'
import {
  eligibleEndings,
  isEnding,
  sceneAnchor,
  remainingEstimate,
  fullPlaythroughEstimate,
} from '../src/game/scenes.js'

const rel = (o = {}) => ({
  Ren: { suspicion: 0, affinity: 0 },
  Kael: { suspicion: 0, affinity: 0 },
  Echo: { suspicion: 0, affinity: 0 },
  ...o,
})

describe('isEnding', () => {
  it('엔딩 노드만 true', () => {
    expect(isEnding('ENDING_SOLO_EXIT')).toBe(true)
    expect(isEnding('PROLOGUE_RAIN_01')).toBe(false)
  })
})

describe('eligibleEndings', () => {
  it('빈자리 조각 4개 → 제인 진엔딩', () => {
    const save = {
      relationships: rel(),
      fragments: ['빈자리 #1', '빈자리 #2', '빈자리 #3', '빈자리 #4'],
    }
    expect(eligibleEndings(save)).toContain('ENDING_JAYNE_ORIGIN')
  })

  it('강한 동맹이 없으면 홀로 걷는 길', () => {
    const save = { relationships: rel({ Ren: { suspicion: 0, affinity: 20 } }) }
    expect(eligibleEndings(save)).toContain('ENDING_SOLO_EXIT')
  })

  it('최고 호감 세력의 엔딩이 열린다(Ren)', () => {
    const save = { relationships: rel({ Ren: { suspicion: 0, affinity: 70 } }) }
    const out = eligibleEndings(save)
    expect(out).toContain('ENDING_REN_MONOPOLY')
    expect(out).not.toContain('ENDING_SOLO_EXIT')
  })

  it('모두 잠잠 + 광범위 신뢰 + 저추적 → NEXUS 신뢰 엔딩', () => {
    const save = {
      relationships: rel({
        Ren: { suspicion: 10, affinity: 60 },
        Kael: { suspicion: 10, affinity: 65 },
      }),
      heat: 20,
    }
    expect(eligibleEndings(save)).toContain('ENDING_NEXUS_TRUST')
  })

  it('추적도가 높으면 NEXUS 신뢰 엔딩은 닫힌다', () => {
    const save = {
      relationships: rel({
        Ren: { suspicion: 10, affinity: 60 },
        Kael: { suspicion: 10, affinity: 65 },
      }),
      heat: 80,
    }
    expect(eligibleEndings(save)).not.toContain('ENDING_NEXUS_TRUST')
  })

  it('빈 세이브라도 최소 하나(안전망)는 반환', () => {
    expect(eligibleEndings({}).length).toBeGreaterThanOrEqual(1)
  })

  it('중복 없이 반환', () => {
    const save = { relationships: rel({ Ren: { suspicion: 0, affinity: 70 } }) }
    const out = eligibleEndings(save)
    expect(out.length).toBe(new Set(out).size)
  })
})

describe('sceneAnchor', () => {
  it('노드의 앵커 구조를 담는다', () => {
    const a = sceneAnchor('PROLOGUE_RAIN_01', 0)
    expect(a).toContain('NODE PROLOGUE_RAIN_01')
    expect(a).toContain('STAGE_NPC:')
    expect(a).toContain('GOAL:')
    expect(a).toContain('ALLOWED_NEXT:')
  })
  it('무효 노드는 빈 문자열', () => {
    expect(sceneAnchor('NOPE')).toBe('')
  })
  it('턴이 예산 미만이면 계속 전개 지시', () => {
    // ACT1_REN_GARAGE_01 은 beatBudget 2 → turn 1/2 는 아직 여유.
    expect(sceneAnchor('ACT1_REN_GARAGE_01', 0)).toContain('keep developing')
  })
  it('턴이 예산에 도달하면 이동 지시', () => {
    expect(sceneAnchor('ACT1_REN_GARAGE_01', 20)).toContain('budget reached')
  })
  it('엔딩 노드는 ALLOWED_NEXT 없음', () => {
    expect(sceneAnchor('ENDING_SOLO_EXIT', 0)).toContain('none')
  })
})

describe('remainingEstimate', () => {
  it('시작 노드는 남은 턴/분이 양수', () => {
    const r = remainingEstimate('PROLOGUE_RAIN_01', 0)
    expect(r.turns).toBeGreaterThan(0)
    expect(r.minutes).toBeGreaterThanOrEqual(1)
  })
  it('무효 노드는 0', () => {
    expect(remainingEstimate('NOPE')).toEqual({ turns: 0, minutes: 0 })
  })
  it('같은 노드에 오래 있을수록 남은 턴이 줄어든다', () => {
    const a = remainingEstimate('PROLOGUE_RAIN_01', 0).turns
    const b = remainingEstimate('PROLOGUE_RAIN_01', 2).turns
    expect(b).toBeLessThanOrEqual(a)
  })
})

describe('fullPlaythroughEstimate', () => {
  it('전체 플레이 추정이 양수', () => {
    const r = fullPlaythroughEstimate()
    expect(r.turns).toBeGreaterThan(0)
    expect(r.minutes).toBeGreaterThan(0)
  })
})
