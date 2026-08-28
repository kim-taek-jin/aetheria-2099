// intent.js — 자유 입력을 authoring 선택지로 분류.
// 모델 호출은 테스트에서 제외하고, 모델이 없을 때의 규칙 기반 폴백과
// nudge(해당 없음) 경로를 검증한다. 이 둘이 무너지면 자유 입력이 다시
// 모델 산문으로 흘러가 품질이 깨진다.
import { describe, it, expect } from 'vitest'
import { classifyByKeyword } from '../src/services/intent.js'
import { SCRIPT, nudgeBeat } from '../src/game/script.js'
import { NPCS, EMOTIONS, TONES, CHOICE_TONES } from '../src/game/lore.js'

const garage = SCRIPT.ACT1_REN_GARAGE_01.choices // [솔직, 거짓말, 도발]
const prologue = SCRIPT.PROLOGUE_RAIN_01.choices // [솔직, 조사, 도주]

describe('classifyByKeyword — 모델 없이도 의도를 잡는다', () => {
  it('솔직한 표현을 Honest 선택지로', () => {
    expect(garage[classifyByKeyword('사실대로 다 털어놓는다', garage)].tone).toBe('Honest')
  })
  it('속이는 표현을 Deceptive 선택지로', () => {
    expect(garage[classifyByKeyword('대충 거짓말로 둘러댄다', garage)].tone).toBe('Deceptive')
  })
  it('공격적 표현을 Aggressive 선택지로', () => {
    expect(garage[classifyByKeyword('위협해서 협박한다', garage)].tone).toBe('Aggressive')
  })
  it('도주 표현을 Flee 선택지로', () => {
    expect(prologue[classifyByKeyword('일단 도망친다', prologue)].tone).toBe('Flee')
  })
  it('조사 표현을 Investigate 선택지로', () => {
    expect(prologue[classifyByKeyword('품을 뒤지며 조사한다', prologue)].tone).toBe('Investigate')
  })
  it('무관한 입력은 -1(해당 없음)', () => {
    expect(classifyByKeyword('춤을 춘다', garage)).toBe(-1)
    expect(classifyByKeyword('', garage)).toBe(-1)
  })
})

describe('nudgeBeat — 해당 없는 입력의 반응도 손으로 쓴다', () => {
  it('씬을 진전시키지 않는다', () => {
    const b = nudgeBeat('ACT1_REN_GARAGE_01')
    expect(b.story_branch).toBe('ACT1_REN_GARAGE_01')
  })
  it('게이지를 건드리지 않는다(무의미한 입력에 벌을 주지 않는다)', () => {
    const b = nudgeBeat('ACT1_REN_GARAGE_01')
    expect(b.suspicion_change).toBe(0)
    expect(b.affinity_change).toBe(0)
    expect(b.heat_change).toBe(0)
  })
  it('그 씬의 화자가 말하고, 선택지는 그대로 유지된다', () => {
    const b = nudgeBeat('ACT2_KAEL_HOLDING_01')
    expect(b.npc_name).toBe('Kael')
    expect(b.generated_choices).toHaveLength(3)
  })
  it('모든 authoring 씬에서 유효한 beat을 만든다', () => {
    for (const id of Object.keys(SCRIPT)) {
      const b = nudgeBeat(id)
      expect(NPCS).toContain(b.npc_name)
      expect(EMOTIONS).toContain(b.npc_emotion)
      expect(TONES).toContain(b.background_tone)
      expect(b.npc_response.length).toBeGreaterThan(4)
      for (const c of b.generated_choices) expect(CHOICE_TONES).toContain(c.tone)
    }
  })
  it('authoring 되지 않은 노드는 null', () => {
    expect(nudgeBeat('ENDING_SOLO_EXIT')).toBeNull()
  })
})
