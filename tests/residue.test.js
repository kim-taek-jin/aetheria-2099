// 잔향 — 회차를 넘어 남는 기억. 다른 루트에서 본 진실이 다음 판의 선택지를 연다.
import { describe, it, expect } from 'vitest'
import {
  RESIDUES,
  RESIDUE_CHOICES,
  RESIDUE_FROM,
  residueChoicesFor,
  residueBeat,
  mergeResidue,
  usedFlag,
} from '../src/game/residue.js'
import { SCRIPT } from '../src/game/script.js'
import { SCENES } from '../src/game/scenes.js'
import { EMOTIONS, CHOICE_TONES } from '../src/game/lore.js'
import { createNewGame, applyResponse } from '../src/game/state.js'

const ALL = Object.entries(RESIDUE_CHOICES).flatMap(([node, list]) => list.map((c) => ({ node, ...c })))

describe('residue — 콘텐츠 계약', () => {
  it('잔향을 남기는 장면이 실제로 존재한다', () => {
    for (const r of Object.values(RESIDUES)) expect(SCRIPT[r.from], r.from).toBeDefined()
  })
  it('잔향 선택지가 붙는 장면이 실제로 존재한다', () => {
    for (const node of Object.keys(RESIDUE_CHOICES)) expect(SCRIPT[node], node).toBeDefined()
  })
  it('모든 잔향은 쓸 곳이 두 곳 이상 있다', () => {
    for (const id of Object.keys(RESIDUES)) {
      expect(ALL.filter((c) => c.requires === id).length, id).toBeGreaterThanOrEqual(2)
    }
  })
  it('잔향은 그것을 얻는 장면 자신에서는 쓰이지 않는다', () => {
    for (const c of ALL) expect(c.node).not.toBe(RESIDUES[c.requires].from)
  })
  it('같은 판 안에서 얻기 전에 쓰는 곳이 하나 이상 있다 — 진짜 회차 보상', () => {
    // 공통 장면(Act1)이나 다른 루트에 붙어 있어야 "지난 판의 기억"이 된다.
    for (const id of Object.keys(RESIDUES)) {
      const from = RESIDUES[id].from
      const route = from.split('_')[1] // REN / KAEL / ECHO
      const elsewhere = ALL.filter((c) => c.requires === id && !c.node.includes(`_${route}_`))
      expect(elsewhere.length, id).toBeGreaterThanOrEqual(1)
    }
  })
  it('enum과 문구 규칙을 지킨다', () => {
    const ids = new Set()
    for (const c of ALL) {
      expect(CHOICE_TONES).toContain(c.tone)
      expect(EMOTIONS).toContain(c.reaction.emotion)
      expect(c.text.startsWith('[잔향]')).toBe(true)
      expect(c.reaction.line.length).toBeGreaterThan(10)
      expect(ids.has(c.id), c.id).toBe(false)
      ids.add(c.id)
      // 원래 선택지와 문구가 겹치면 choiceBeat가 먼저 잡아 잔향이 무시된다.
      expect(SCRIPT[c.node].choices.map((x) => x.text)).not.toContain(c.text)
    }
  })
  it('RESIDUE_FROM 역색인이 정확하다', () => {
    for (const [id, r] of Object.entries(RESIDUES)) expect(RESIDUE_FROM[r.from]).toBe(id)
    for (const node of Object.keys(RESIDUE_FROM)) expect(SCENES[node]).toBeDefined()
  })
})

describe('residue — 열림 조건', () => {
  it('모르는 잔향의 선택지는 열리지 않는다', () => {
    expect(residueChoicesFor('ACT1_REN_GARAGE_01', [], {})).toEqual([])
  })
  it('아는 잔향이면 열리고, 표시가 붙는다', () => {
    const out = residueChoicesFor('ACT1_REN_GARAGE_01', ['ledger'], {})
    expect(out).toHaveLength(1)
    expect(out[0].residue).toBe(true)
  })
  it('이번 판에 이미 쓴 잔향은 다시 열리지 않는다', () => {
    const c = RESIDUE_CHOICES.ACT1_REN_GARAGE_01[0]
    expect(residueChoicesFor('ACT1_REN_GARAGE_01', ['ledger'], { [usedFlag(c.id)]: true })).toEqual([])
  })
  it('잔향이 없는 장면은 빈 목록', () => {
    expect(residueChoicesFor('PROLOGUE_RAIN_01', Object.keys(RESIDUES), {})).toEqual([])
  })
})

describe('residue — 상태머신 통합', () => {
  it('잔향 선택은 장면을 진전시키지 않고, 쓴 표시를 남긴다', () => {
    const node = 'ACT1_REN_GARAGE_01'
    const c = RESIDUE_CHOICES[node][0]
    const s = { ...createNewGame(), currentNode: node }
    const b = { ...residueBeat(node, c.text, SCRIPT[node].choices), npc_name: 'Ren', background_tone: 'Normal' }
    const n = applyResponse(s, b, c.text)
    expect(n.currentNode).toBe(node)
    expect(n.flags[usedFlag(c.id)]).toBe(true)
    expect(residueChoicesFor(node, ['ledger'], n.flags)).toEqual([])
  })
  it('잔향 선택 뒤에도 원래 선택지 3개가 남는다', () => {
    const node = 'ACT2_REN_BACKROOM_01'
    const c = RESIDUE_CHOICES[node][0]
    expect(residueBeat(node, c.text, SCRIPT[node].choices).generated_choices).toHaveLength(3)
  })
  it('잔향으로 얻은 조각이 기록된다', () => {
    const node = 'ACT1_DECRYPT_01'
    const c = RESIDUE_CHOICES[node][0]
    const s = { ...createNewGame(), currentNode: node }
    const n = applyResponse(s, { ...residueBeat(node, c.text, SCRIPT[node].choices), npc_name: 'NEXUS' }, c.text)
    expect(n.fragments.some((f) => f.includes('41층'))).toBe(true)
  })
  it('없는 문구면 null', () => {
    expect(residueBeat('ACT1_REN_GARAGE_01', '아무거나', [])).toBeNull()
  })
})

describe('residue — 영구 기록', () => {
  it('새 잔향만 새것으로 친다', () => {
    expect(mergeResidue([], 'ledger')).toEqual({ known: ['ledger'], isNew: true })
    expect(mergeResidue(['ledger'], 'ledger').isNew).toBe(false)
  })
  it('알 수 없는 id·깨진 값은 걸러낸다', () => {
    expect(mergeResidue(['ledger', 'bogus', 3], 'nope')).toEqual({ known: ['ledger'], isNew: false })
    expect(mergeResidue(null, 'signature').known).toEqual(['signature'])
  })
})
