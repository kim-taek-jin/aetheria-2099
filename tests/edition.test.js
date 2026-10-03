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
  it('체험판에서는 카엘·에코의 Act2만 잠근다', () => {
    const locked = Object.keys(SCENES).filter((id) => isLockedNode(id, true))
    expect(locked.length).toBeGreaterThan(0)
    for (const id of locked) expect(id).toMatch(/^ACT2_(KAEL|ECHO)_/)
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
