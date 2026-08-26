// prefetch.js — 선생성 캐시. "낡은 상태의 비트를 쓰지 않는다"가 핵심 불변식.
import { describe, it, expect, vi } from 'vitest'
import { createPrefetcher } from '../src/services/prefetch.js'

// 호출을 기록하고, 수동으로 완료시킬 수 있는 가짜 생성기.
function makeGen() {
  const calls = []
  const gen = vi.fn(({ playerInput, signal }) => {
    const rec = { playerInput, signal, resolve: null }
    rec.promise = new Promise((res) => {
      rec.resolve = res
    })
    calls.push(rec)
    return rec.promise
  })
  return { gen, calls }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('createPrefetcher', () => {
  it('선택지를 순차로 생성한다(동시 실행 금지 — GPU 하나)', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A', 'B', 'C'], { save: {} })
    await flush()
    expect(calls.length).toBe(1) // 첫 번째만 시작
    calls[0].resolve({ ok: true, data: 'A결과' })
    await flush()
    expect(calls.length).toBe(2) // 끝나야 다음
    expect(calls[1].playerInput).toBe('B')
  })

  it('완성된 선택을 고르면 그 결과를 돌려준다(대기 0)', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A', 'B'], {})
    await flush()
    calls[0].resolve({ ok: true, data: 'A결과' })
    await flush()
    const hit = pf.take('k1', 'A')
    expect(hit).not.toBeNull()
    await expect(hit).resolves.toEqual({ ok: true, data: 'A결과' })
  })

  it('아직 생성 중인 선택은 그 생성을 기다린다', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A', 'B'], {})
    await flush()
    const hit = pf.take('k1', 'A') // A는 아직 진행 중
    expect(hit).not.toBeNull()
    calls[0].resolve({ ok: true, data: '나중결과' })
    await expect(hit).resolves.toEqual({ ok: true, data: '나중결과' })
  })

  it('캐시에 없는 입력(자유 입력)은 null — 호출자가 직접 생성', async () => {
    const { gen } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A', 'B'], {})
    await flush()
    expect(pf.take('k1', '직접 타이핑한 행동')).toBeNull()
  })

  it('상태 서명이 다르면 절대 쓰지 않는다(낡은 비트 방지)', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A'], {})
    await flush()
    calls[0].resolve({ ok: true, data: '낡은결과' })
    await flush()
    expect(pf.take('k2', 'A')).toBeNull() // 다른 상태 → 폐기
  })

  it('고르는 순간 나머지 대기 생성은 취소된다(GPU 해방)', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A', 'B'], {})
    await flush()
    expect(calls[0].signal.aborted).toBe(false)
    pf.take('k1', 'B') // A가 진행 중인데 B를 골랐다
    expect(calls[0].signal.aborted).toBe(true)
  })

  it('reset은 진행 중인 생성을 모두 취소한다', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A'], {})
    await flush()
    pf.reset()
    expect(calls[0].signal.aborted).toBe(true)
    expect(pf.take('k1', 'A')).toBeNull()
  })

  it('같은 키로 다시 start해도 재시작하지 않는다', async () => {
    const { gen, calls } = makeGen()
    const pf = createPrefetcher(gen)
    pf.start('k1', ['A'], {})
    await flush()
    pf.start('k1', ['A'], {})
    await flush()
    expect(calls.length).toBe(1)
  })
})
