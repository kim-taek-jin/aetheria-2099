// 영어판 — 한국어판과 범위가 같고, 로직은 한 곳(한국어 SCRIPT)에서만 온다.
import { describe, it, expect } from 'vitest'
import { SCRIPT, choiceBeat, openingBeat } from '../src/game/script.js'
import { SCRIPT_EN } from '../src/game/script.en.js'
import { SCENES, routeChoicesOf, endingChoicesFor } from '../src/game/scenes.js'
import { SCENE_TITLE_EN, FRAGMENTS_EN, WEAK_POINT_BY_KO } from '../src/game/content.en.js'
import {
  RESIDUES,
  RESIDUES_EN,
  RESIDUE_CHOICES,
  RESIDUE_CHOICES_EN,
  RESIDUE_FRAGMENTS_EN,
  residueChoicesFor,
  residueBeat,
} from '../src/game/residue.js'
import { localizeFixedChoices, fragmentText, sceneLabel } from '../src/game/localize.js'
import { UI } from '../src/i18n/ui.js'
import { tr } from '../src/i18n/index.js'
import { createNewGame } from '../src/game/state.js'

const HANGUL = /[가-힣]/
const strings = (o) =>
  typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : []

describe('i18n — 본문이 빠짐없이 영어로 있다', () => {
  it('모든 장면에 영어가 있고 선택 수가 같다', () => {
    for (const [id, s] of Object.entries(SCRIPT)) {
      const e = SCRIPT_EN[id]
      expect(e, id).toBeDefined()
      expect(e.choices.length, id).toBe(s.choices.length)
      for (const r of Object.keys(s.byRoute || {})) expect(e.byRoute?.[r], `${id}/${r}`).toBeDefined()
    }
  })
  it('영어 본문에 한글이 섞이지 않는다', () => {
    for (const [id, e] of Object.entries(SCRIPT_EN))
      for (const str of strings(e)) expect(str, id).not.toMatch(HANGUL)
  })
  it('영어 선택지·반응이 비어 있지 않다', () => {
    for (const [id, e] of Object.entries(SCRIPT_EN))
      for (const c of e.choices) {
        expect(c.text?.length, id).toBeGreaterThan(5)
        expect(c.reaction?.narration?.length, id).toBeGreaterThan(10)
        expect(c.reaction?.line?.length, id).toBeGreaterThan(3)
      }
  })
  it('같은 장면 안에서 영어 선택지 문구가 겹치지 않는다(클릭이 다른 선택으로 새지 않게)', () => {
    for (const [id, e] of Object.entries(SCRIPT_EN)) {
      const texts = e.choices.map((c) => c.text)
      expect(new Set(texts).size, id).toBe(texts.length)
    }
  })
})

describe('i18n — 로직은 언어와 무관하다', () => {
  it('영어 선택이 한국어 선택과 같은 다음 장면·효과로 간다', () => {
    for (const [id, s] of Object.entries(SCRIPT)) {
      s.choices.forEach((c, i) => {
        const ko = choiceBeat(id, c.text, null, 'ko')
        const en = choiceBeat(id, SCRIPT_EN[id].choices[i].text, null, 'en')
        expect(en.story_branch, `${id}#${i}`).toBe(ko.story_branch)
        expect(en.affinity_change).toBe(ko.affinity_change)
        expect(en.heat_change).toBe(ko.heat_change)
        expect(en.suspicion_change).toBe(ko.suspicion_change)
      })
    }
  })
  it('언어를 바꾼 직후 옛 언어 문구로 눌러도 같은 선택으로 간다', () => {
    const id = 'ACT1_REN_GARAGE_01'
    const b = choiceBeat(id, SCRIPT[id].choices[1].text, null, 'en')
    expect(b.story_branch).toBe(SCRIPT[id].choices[1].next)
    expect(b.narration).not.toMatch(HANGUL)
  })
  it('영어 반응에는 영어 이름표가 붙는다', () => {
    const id = 'ACT1_REN_GARAGE_01'
    const b = choiceBeat(id, SCRIPT_EN[id].choices[0].text, null, 'en')
    expect(b.narration).toContain('Ren — "')
  })
  it('동행별 장면도 영어로 바뀐다', () => {
    const texts = ['Ren', 'Kael', 'Echo'].map((r) => openingBeat('ACT3_VIGIL_01', r, 'en').npc_response)
    expect(new Set(texts).size).toBe(3)
    for (const t of texts) expect(t).not.toMatch(HANGUL)
  })
})

describe('i18n — 분기·결말 선택지', () => {
  it('분기 선택지가 영어 본문 문구로 바뀌고, 그 문구로 분기한다', () => {
    const node = 'ACT1_SKY_GLITCH_01'
    const en = localizeFixedChoices(node, routeChoicesOf(node), 'en')
    for (const c of en) {
      expect(c.text).not.toMatch(HANGUL)
      expect(choiceBeat(node, c.text, null, 'en').story_branch).toBe(c.branch)
    }
  })
  it('결말 선택지도 영어로 바뀌고 그 결말로 간다', () => {
    const save = { ...createNewGame(), currentNode: 'ACT3_DESIGNER_CONFRONT_01' }
    const en = localizeFixedChoices(save.currentNode, endingChoicesFor(save), 'en')
    expect(en.length).toBeGreaterThan(0)
    for (const c of en) {
      expect(c.text).not.toMatch(HANGUL)
      expect(choiceBeat(save.currentNode, c.text, null, 'en').story_branch).toBe(c.branch)
    }
  })
})

describe('i18n — 장면 메타·조각·잔향', () => {
  it('모든 장면 제목이 영어로 있다', () => {
    for (const id of Object.keys(SCENES)) expect(SCENE_TITLE_EN[id], id).toBeTruthy()
    expect(sceneLabel('ACT2_REN_LEDGER_01', 'en')).toBe('[Act 2 · Ren] The Ledger')
  })
  it('모든 약점 힌트가 영어로 있다', () => {
    for (const s of Object.values(SCENES)) if (s.weakPoint) expect(WEAK_POINT_BY_KO[s.weakPoint]).toBeTruthy()
  })
  it('장면이 주는 모든 기억 조각이 영어로 있다', () => {
    for (const [id, s] of Object.entries(SCENES)) {
      for (const f of [s.revealsFragment, s.gapFragment].filter(Boolean)) {
        expect(FRAGMENTS_EN[f], id).toBeTruthy()
        expect(fragmentText(f, 'en')).not.toMatch(HANGUL)
      }
    }
  })
  it('잔향 조각·이름·선택지가 영어로 있다', () => {
    for (const id of Object.keys(RESIDUES)) expect(RESIDUES_EN[id]?.label).toBeTruthy()
    for (const list of Object.values(RESIDUE_CHOICES))
      for (const c of list) {
        const e = RESIDUE_CHOICES_EN[c.id]
        expect(e?.text, c.id).toBeTruthy()
        expect(e.reaction.line).not.toMatch(HANGUL)
        for (const f of c.fragments || []) expect(RESIDUE_FRAGMENTS_EN[f], c.id).toBeTruthy()
      }
  })
  it('영어 잔향 선택지로 눌러도 같은 잔향이 실행된다', () => {
    const node = 'ACT1_REN_GARAGE_01'
    const [c] = residueChoicesFor(node, ['ledger'], {}, 'en')
    const b = residueBeat(node, c.text, SCRIPT[node].choices, 'en')
    expect(b.set_flags[0]).toContain('ledger_garage')
    expect(b.npc_response).not.toMatch(HANGUL)
  })
})

describe('i18n — 화면 문구', () => {
  it('한국어 문구 키가 모두 영어에도 있다', () => {
    for (const k of Object.keys(UI.ko)) expect(UI.en[k], k).toBeDefined()
  })
  it('영어 화면 문구에 한글이 없다(언어 전환 버튼 제외)', () => {
    for (const [k, v] of Object.entries(UI.en)) {
      if (k === 'langToggle' || k === 'langToggleTitle') continue
      const s = typeof v === 'function' ? v({ npc: 'Ren', a: 1, s: 1, t: 1, turns: 1, mins: 1, n: 1, total: 6, label: 'x', m: 1 }) : v
      expect(s, k).not.toMatch(HANGUL)
    }
  })
  it('함수형 문구가 변수를 채운다', () => {
    expect(tr('en', 'footerTurns', { t: 3, turns: 9, mins: 6 })).toBe('T3 · about 9 turns to an ending (~6 min)')
    expect(tr('ko', 'footerTurns', { t: 3, turns: 9, mins: 6 })).toBe('T3 · 엔딩까지 약 9턴 (~6분)')
  })
})
