// geminiService.js — AI 출력 방어선(safeParse/normalize) 테스트.
// 모델이 무엇을 뱉든 게임이 쓰는 안전한 형태로 강제되는지 검증.
import { describe, it, expect } from 'vitest'
import { safeParse, normalize } from '../src/services/geminiService.js'
import { NPCS, EMOTIONS, TONES, CHOICE_TONES } from '../src/game/lore.js'

const save = {
  activeNpc: 'Kael',
  currentNode: 'PROLOGUE_RAIN_01',
  backgroundTone: 'Danger',
}

describe('safeParse', () => {
  it('순수 JSON', () => {
    expect(safeParse('{"a":1}')).toEqual({ a: 1 })
  })
  it('앞뒤 노이즈가 껴도 첫 { ~ 마지막 } 추출', () => {
    expect(safeParse('설명: {"a":1} 끝')).toEqual({ a: 1 })
  })
  it('JSON이 없으면 null', () => {
    expect(safeParse('그냥 텍스트')).toBeNull()
    expect(safeParse('')).toBeNull()
  })
})

describe('normalize — enum 폴백', () => {
  it('무효 enum은 안전값/세이브 값으로 대체', () => {
    const n = normalize(
      { npc_name: 'ZZZ', npc_emotion: 'ZZZ', background_tone: 'ZZZ', story_branch: 'ZZZ' },
      save,
    )
    expect(NPCS).toContain(n.npc_name)
    expect(n.npc_name).toBe(save.activeNpc)
    expect(EMOTIONS).toContain(n.npc_emotion)
    expect(TONES).toContain(n.background_tone)
    expect(n.background_tone).toBe(save.backgroundTone)
    expect(n.story_branch).toBe(save.currentNode)
  })
})

describe('normalize — 수치 클램프', () => {
  it('범위를 벗어난 값은 -10..10로, 실수는 반올림', () => {
    const n = normalize({ suspicion_change: 999, affinity_change: -999, heat_change: 3.7 }, save)
    expect(n.suspicion_change).toBe(10)
    expect(n.affinity_change).toBe(-10)
    expect(n.heat_change).toBe(4)
  })
})

describe('normalize — 선택지 항상 3개', () => {
  it('부족하면 채우고', () => {
    const n = normalize({ generated_choices: [{ text: '하나', tone: 'Honest' }] }, save)
    expect(n.generated_choices).toHaveLength(3)
    n.generated_choices.forEach((c) => {
      expect(typeof c.text).toBe('string')
      expect(CHOICE_TONES).toContain(c.tone)
    })
  })
  it('넘치면 3개로 자른다', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ text: `c${i}`, tone: 'Honest' }))
    const n = normalize({ generated_choices: many }, save)
    expect(n.generated_choices).toHaveLength(3)
  })
  it('너무 긴 선택지는 잘라 메뉴처럼 짧게', () => {
    const long = '[솔직하게] ' + '아주 긴 문장을 늘어놓는 선택지 '.repeat(6)
    const n = normalize({ generated_choices: [{ text: long, tone: 'Honest' }] }, save)
    expect(n.generated_choices[0].text.length).toBeLessThanOrEqual(40)
    expect(n.generated_choices[0].text.endsWith('…')).toBe(true)
  })
})

describe('normalize — 한자 제거', () => {
  it('플레이어 노출 텍스트의 한자와 빈 괄호를 지운다', () => {
    const n = normalize({ narration: '압류(押留)된 기억', npc_response: '賢者의 말' }, save)
    expect(n.narration).not.toMatch(/[㐀-鿿]/)
    expect(n.narration).toContain('압류')
    expect(n.narration).not.toContain('()')
    expect(n.npc_response).not.toMatch(/[㐀-鿿]/)
  })
})

describe('normalize — set_flags / evidence_result', () => {
  it('flag는 [a-z0-9_]만 통과, 최대 6개', () => {
    const flags = ['ok_1', 'bad flag', '한글', 'x'.repeat(3), 'a', 'b', 'c', 'd', 'e', 'f', 'g']
    const n = normalize({ set_flags: flags }, save)
    expect(n.set_flags.length).toBeLessThanOrEqual(6)
    expect(n.set_flags).not.toContain('bad flag')
    expect(n.set_flags).not.toContain('한글')
    expect(n.set_flags).toContain('ok_1')
  })
  it('evidence_result는 hit/miss만, 나머지는 none', () => {
    expect(normalize({ evidence_result: 'hit' }, save).evidence_result).toBe('hit')
    expect(normalize({ evidence_result: 'weird' }, save).evidence_result).toBe('none')
    expect(normalize({}, save).evidence_result).toBe('none')
  })
})
