// 체험판 — 렌의 길 하나를 처음부터 결말까지. 잠긴 길은 보이되 들어갈 수 없다.
import { describe, it, expect } from 'vitest'
import { isLockedNode, markLockedChoices, LOCKED_ROUTES } from '../src/game/edition.js'
import { SCRIPT } from '../src/game/script.js'
import { SCENES, routeChoicesOf } from '../src/game/scenes.js'
import { RESIDUES, RESIDUE_CHOICES } from '../src/game/residue.js'

describe('edition — 잠금 판정', () => {
  it('정식판에서는 아무것도 잠그지 않는다', () => {
    for (const id of Object.keys(SCENES)) expect(isLockedNode(id, false)).toBe(false)
  })
  it('체험판에서는 카엘·에코의 Act2와 숨겨진 결말 둘만 잠근다', () => {
    const locked = Object.keys(SCENES).filter((id) => isLockedNode(id, true))
    expect(locked.length).toBeGreaterThan(0)
    for (const id of locked) expect(id).toMatch(/^(ACT2_(KAEL|ECHO)_|ENDING_(JAYNE_ORIGIN|NEXUS_TRUST)$)/)
    // 렌의 길·공통 장면·결말은 열려 있다.
    for (const id of ['PROLOGUE_RAIN_01', 'ACT1_SKY_GLITCH_01', 'ACT2_REN_LEDGER_01', 'ACT3_CORE_APPROACH_01'])
      expect(isLockedNode(id, true), id).toBe(false)
  })
  it('분기 선택지는 숨기지 않고 자물쇠만 채운다', () => {
    const choices = markLockedChoices(routeChoicesOf('ACT1_SKY_GLITCH_01'), true)
    expect(choices).toHaveLength(3)
    expect(choices.filter((c) => c.locked).map((c) => c.branch).sort()).toEqual([
      'ACT2_ECHO_BROADCAST_01',
      'ACT2_KAEL_INTERROGATION_01',
    ])
  })
  it('정식판에서는 선택지를 건드리지 않는다', () => {
    const raw = routeChoicesOf('ACT1_SKY_GLITCH_01')
    expect(markLockedChoices(raw, false)).toBe(raw)
  })
})

describe('edition — 체험판도 한 판이 온전하다', () => {
  it('렌의 길로 잠긴 장면을 밟지 않고 결말 노드까지 간다', () => {
    // 분기에서 렌을 고른 뒤, 어느 선택을 해도 잠긴 장면으로 새지 않아야 한다.
    const seen = new Set()
    const stack = ['PROLOGUE_RAIN_01']
    let reachedEnding = false
    while (stack.length) {
      const node = stack.pop()
      if (seen.has(node)) continue
      seen.add(node)
      if (node.startsWith('ENDING_')) {
        reachedEnding = true
        continue
      }
      expect(isLockedNode(node, true), `체험판 경로가 ${node}로 샌다`).toBe(false)
      const s = SCRIPT[node]
      const nexts = node === 'ACT1_SKY_GLITCH_01' ? ['ACT2_REN_AUCTION_01'] : s.choices.map((c) => c.next)
      for (const n of nexts) if (n) stack.push(n)
    }
    expect(reachedEnding).toBe(true)
    expect([...seen].some((id) => id === 'ACT3_DESIGNER_CONFRONT_01')).toBe(true)
  })
  it('체험판에서 잔향 하나(렌의 장부)를 실제로 얻을 수 있다', () => {
    expect(isLockedNode(RESIDUES.ledger.from, true)).toBe(false)
    // 그리고 그 잔향을 쓸 곳이 체험판 안에도 있다 — 2회차를 체험판에서 맛본다.
    const usable = Object.entries(RESIDUE_CHOICES).filter(
      ([node, list]) => !isLockedNode(node, true) && list.some((c) => c.requires === 'ledger'),
    )
    expect(usable.length).toBeGreaterThanOrEqual(1)
  })
  it('잠긴 루트마다 이름표가 있다', () => {
    for (const r of Object.values(LOCKED_ROUTES)) expect(r.label).toMatch(/의 길$/)
  })
})

import { LOCKED_ENDINGS, isWithheldGap, demoGapFragment, REDACTED_GAP } from '../src/game/edition.js'
import { applyResponse } from '../src/game/state.js'
import { choiceBeat, SCRIPT } from '../src/game/script.js'
import { fragmentText } from '../src/game/localize.js'
import { endingChoicesFor, eligibleEndings } from '../src/game/scenes.js'
import { createNewGame } from '../src/game/state.js'

describe('edition — 체험판은 반전을 풀지 않는다', () => {
  // 렌 루트로 진엔딩·숨겨진 결말 조건까지 다 갖춘 판
  const fullyEarned = () => {
    const s = { ...createNewGame(), currentNode: 'ACT3_DESIGNER_CONFRONT_01', route: 'Ren', heat: 10 }
    s.relationships = {
      Ren: { affinity: 45, suspicion: 10 },
      Kael: { affinity: 30, suspicion: 10 },
      Echo: { affinity: 10, suspicion: 10 },
    }
    s.fragments = [1, 2, 3, 4].map((n) => `기억 조각 · 빈자리 #${n}: …`)
    return s
  }

  it('조건을 갖추면 진엔딩·숨겨진 결말이 자격 목록에 오른다(전제 확인)', () => {
    const elig = eligibleEndings(fullyEarned())
    for (const id of LOCKED_ENDINGS) expect(elig, id).toContain(id)
  })
  it('체험판에선 그 둘이 자물쇠로 보이고, 정식판에선 열려 있다', () => {
    const choices = endingChoicesFor(fullyEarned())
    const demo = markLockedChoices(choices, true)
    for (const id of LOCKED_ENDINGS) expect(demo.find((c) => c.branch === id)?.locked, id).toBe(true)
    for (const c of markLockedChoices(choices, false)) expect(c.locked).toBeUndefined()
  })
  it('체험판에서도 고를 수 있는 결말이 언제나 하나 이상 남는다', () => {
    for (const aff of [5, 24, 25, 60]) {
      const s = fullyEarned()
      s.relationships.Ren.affinity = aff
      const open = markLockedChoices(endingChoicesFor(s), true).filter((c) => !c.locked)
      expect(open.length, `렌 호감 ${aff}`).toBeGreaterThanOrEqual(1)
    }
  })
  it('잠긴 결말 노드로는 들어갈 수 없다(자유 입력 우회 포함)', () => {
    for (const id of LOCKED_ENDINGS) {
      expect(isLockedNode(id, true)).toBe(true)
      expect(isLockedNode(id, false)).toBe(false)
    }
    expect(isLockedNode('ENDING_REN_MONOPOLY', true)).toBe(false)
    expect(isLockedNode('ENDING_SOLO_EXIT', true)).toBe(false)
  })
  it('반전이 적힌 빈자리 #4는 체험판에서 지급하지 않는다', () => {
    expect(SCENES.ACT3_DESIGNER_CONFRONT_01.gapFragment).toMatch(/수석 연구원/)
    expect(isWithheldGap('ACT3_DESIGNER_CONFRONT_01', true)).toBe(true)
    expect(isWithheldGap('ACT3_DESIGNER_CONFRONT_01', false)).toBe(false)
    expect(isWithheldGap('ACT3_CORE_APPROACH_01', true)).toBe(false)
  })
  it('체험판에선 빈자리 #4가 가린 조각으로 지급된다 — 반전은 없고 자격은 남는다', () => {
    expect(demoGapFragment('ACT3_DESIGNER_CONFRONT_01', true)).toBe(REDACTED_GAP)
    expect(demoGapFragment('ACT3_DESIGNER_CONFRONT_01', false)).toBeNull()
    expect(REDACTED_GAP).toMatch(/빈자리/) // 진엔딩 자격 판정이 이 단어로 센다
    expect(REDACTED_GAP).not.toMatch(/연구원|리엔|피험자/)
    expect(fragmentText(REDACTED_GAP, 'en')).not.toMatch(/[가-힣]/)
  })
  it('정식판에선 원래 조각이 그대로 지급된다(테스트 환경 = 정식판)', () => {
    const s = { ...createNewGame(), currentNode: 'ACT3_VIGIL_01', route: 'Ren' }
    const n = applyResponse(s, choiceBeat('ACT3_VIGIL_01', SCRIPT.ACT3_VIGIL_01.choices[0].text, 'Ren'), 'x')
    expect(n.fragments.some((f) => f.includes('수석 연구원'))).toBe(true)
  })
})

describe('edition — 체험판에서도 결말은 선택이어야 한다', () => {
  // itch.io 피드백: "I kept getting blocked by full version coming soon."
  // 숨겨진 결말 둘을 잠그면 루트를 끝까지 판 플레이어에게 남는 선택지가 하나뿐이었다.
  const earned = (aff) => {
    const b = createNewGame()
    return {
      ...b,
      currentNode: 'ACT3_DESIGNER_CONFRONT_01',
      route: 'Ren',
      heat: 10,
      relationships: {
        ...b.relationships,
        Ren: { ...b.relationships.Ren, affinity: aff, suspicion: 10 },
        Kael: { ...b.relationships.Kael, affinity: 30, suspicion: 10 },
        Echo: { ...b.relationships.Echo, affinity: 10, suspicion: 10 },
      },
      fragments: [1, 2, 3, 4].map((n) => `기억 조각 · 빈자리 #${n}: …`),
    }
  }
  const openCount = (save, demo) =>
    (endingChoicesFor(save, demo) || []).filter((c) => !isLockedNode(c.branch, demo)).length

  it('루트를 끝까지 판 플레이어도 체험판에서 결말을 2개 이상 고를 수 있다', () => {
    expect(openCount(earned(45), true)).toBeGreaterThanOrEqual(2)
  })
  it('정식판 결말 구성은 그대로다(체험판 보정이 새지 않는다)', () => {
    const full = endingChoicesFor(earned(45), false) || []
    expect(full.map((c) => c.branch)).not.toContain('ENDING_SOLO_EXIT')
    expect(full.filter((c) => isLockedNode(c.branch, false))).toHaveLength(0)
  })
  it('관계를 못 쌓았어도 고를 결말이 남는다', () => {
    expect(openCount(earned(10), true)).toBeGreaterThanOrEqual(1)
  })
})
