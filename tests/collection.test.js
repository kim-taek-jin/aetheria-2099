// collection.js — 결말 수집의 순수 병합 로직 테스트(LocalStorage 무관).
import { describe, it, expect } from 'vitest'
import { mergeDiscovered, ALL_ENDINGS, ENDING_COUNT } from '../src/game/collection.js'

describe('ALL_ENDINGS', () => {
  it('6개의 고유 엔딩 + 카운트 일치', () => {
    expect(ENDING_COUNT).toBe(6)
    expect(ALL_ENDINGS).toHaveLength(6)
    expect(new Set(ALL_ENDINGS.map((e) => e.id)).size).toBe(6)
  })
})

describe('mergeDiscovered', () => {
  it('처음 발견하면 추가하고 isNew=true', () => {
    const r = mergeDiscovered([], 'ENDING_SOLO_EXIT')
    expect(r.discovered).toEqual(['ENDING_SOLO_EXIT'])
    expect(r.isNew).toBe(true)
  })
  it('이미 있으면 중복 없이 isNew=false', () => {
    const r = mergeDiscovered(['ENDING_SOLO_EXIT'], 'ENDING_SOLO_EXIT')
    expect(r.discovered).toEqual(['ENDING_SOLO_EXIT'])
    expect(r.isNew).toBe(false)
  })
  it('기존 목록을 보존하며 새 항목 추가', () => {
    const r = mergeDiscovered(['ENDING_SOLO_EXIT'], 'ENDING_REN_MONOPOLY')
    expect(r.discovered).toEqual(['ENDING_SOLO_EXIT', 'ENDING_REN_MONOPOLY'])
    expect(r.isNew).toBe(true)
  })
  it('깨진 입력도 안전하게 처리', () => {
    const r = mergeDiscovered(null, 'ENDING_SOLO_EXIT')
    expect(r.discovered).toEqual(['ENDING_SOLO_EXIT'])
    expect(r.isNew).toBe(true)
  })
})
