// offline.js — 키 없이 도는 스크립트 데모 진행 로직.
import { describe, it, expect } from 'vitest'
import { DEMO_BEATS, nextDemoBeat } from '../src/game/offline.js'

describe('DEMO_BEATS', () => {
  it('각 비트가 게임 비트 형태(선택지 포함)', () => {
    expect(DEMO_BEATS.length).toBeGreaterThan(0)
    for (const b of DEMO_BEATS) {
      expect(typeof b.npc_response).toBe('string')
      expect(Array.isArray(b.generated_choices)).toBe(true)
    }
  })
})

describe('nextDemoBeat', () => {
  it('선택이 없으면 첫 비트', () => {
    expect(nextDemoBeat(null, 5)).toBe(DEMO_BEATS[0])
  })
  it('choice.next가 숫자면 그 인덱스', () => {
    expect(nextDemoBeat({ next: 2 }, 0)).toBe(DEMO_BEATS[2])
  })
  it('next가 없으면 현재+1', () => {
    expect(nextDemoBeat({}, 0)).toBe(DEMO_BEATS[1])
  })
  it('범위를 벗어나면 마지막 비트(안전망)', () => {
    expect(nextDemoBeat({}, 999)).toBe(DEMO_BEATS[DEMO_BEATS.length - 1])
    expect(nextDemoBeat({ next: 999 }, 0)).toBe(DEMO_BEATS[DEMO_BEATS.length - 1])
  })
})
