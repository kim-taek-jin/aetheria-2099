// scenes.js — 결정론적 엔딩 게이트(eligibleEndings) 테스트.
// 시스템(호감/의심/추적/조각)이 "열리는 엔딩"을 실제로 결정하는지 검증.
import { describe, it, expect } from 'vitest'
import { CHOICE_TONES } from '../src/game/lore.js'
import {
  eligibleEndings,
  isEnding,
  sceneAnchor,
  remainingEstimate,
  fullPlaythroughEstimate,
  judgeEvidence,
  weakPointOf,
  routeChoicesOf,
  SCENES,
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

  it('강한 동맹이 없으면 홀로 걷는 길(문턱 20 미만)', () => {
    const save = { relationships: rel({ Ren: { suspicion: 0, affinity: 15 } }) }
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

describe('judgeEvidence — 증거 판정을 클라이언트가 쥔다(추리 성립 조건)', () => {
  it('씬의 약점을 찌르는 조각은 hit', () => {
    expect(judgeEvidence('ACT2_REN_AUCTION_01', '기억 조각 · 미매각 칩 #00-X: 사랑했던 사람의 마지막 미소.', false)).toBe('hit')
    expect(judgeEvidence('ACT2_KAEL_HOLDING_01', '아렌의 군용 인식표 데이터', false)).toBe('hit')
    expect(judgeEvidence('ACT2_ECHO_BROADCAST_01', '기록 조각: 스카이라인이 초록이었다.', false)).toBe('hit')
  })
  it('무관한 조각은 miss — 비용이 따른다', () => {
    expect(judgeEvidence('ACT2_REN_AUCTION_01', '기록 조각: 스카이라인이 초록이었다.', false)).toBe('miss')
    expect(judgeEvidence('ACT2_KAEL_HOLDING_01', '미매각 칩 #00-X', false)).toBe('miss')
  })
  it('재사용은 언제나 miss(희소성)', () => {
    expect(judgeEvidence('ACT2_REN_AUCTION_01', '미매각 칩 #00-X', true)).toBe('miss')
  })
  it('정답이 정의되지 않은 씬은 null — 모델 판정을 그대로 둔다', () => {
    expect(judgeEvidence('PROLOGUE_RAIN_01', '아무 조각', false)).toBeNull()
  })
  it('약점 힌트가 있는 씬은 추리 단서를 노출한다', () => {
    expect(weakPointOf('ACT2_REN_AUCTION_01')).toMatch(/값/)
    expect(weakPointOf('PROLOGUE_RAIN_01')).toBeNull()
  })
})

describe('routeChoicesOf — 루트 분기는 플레이어가 고른다', () => {
  it('분기 노드는 세 세력으로 가는 선택지를 직접 제공한다', () => {
    const rc = routeChoicesOf('ACT1_SKY_GLITCH_01')
    expect(rc).toHaveLength(3)
    expect(rc.map((c) => c.branch).sort()).toEqual(
      ['ACT2_ECHO_BROADCAST_01', 'ACT2_KAEL_INTERROGATION_01', 'ACT2_REN_AUCTION_01'].sort()
    )
  })
  it('각 branch는 그 씬의 next에 실제로 존재한다(끊긴 링크 방지)', () => {
    const rc = routeChoicesOf('ACT1_SKY_GLITCH_01')
    const next = SCENES.ACT1_SKY_GLITCH_01.next
    for (const c of rc) expect(next).toContain(c.branch)
  })
  it('각 선택지는 유효한 톤을 가진다(UI 렌더 안전)', () => {
    for (const c of routeChoicesOf('ACT1_SKY_GLITCH_01')) {
      expect(CHOICE_TONES).toContain(c.tone)
    }
  })
  it('분기 노드가 아니면 null — 모델 생성 선택지를 쓴다', () => {
    expect(routeChoicesOf('PROLOGUE_RAIN_01')).toBeNull()
  })
})
