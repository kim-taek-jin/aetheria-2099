// 로컬 모델 탐지 — 웹 방문자에게는 아예 시도하지 않고, 시도하더라도 시간 제한을 둔다.
// itch.io 첫 댓글이 "It wouldn't load for me. Timed out."이었고, 원인이 응답 없는
// localhost 요청을 첫 화면에서 기다리던 것이었다.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isAvailable, localModelPossible, LOCAL_PROBE_TIMEOUT_MS } from '../src/services/ollamaProvider.js'

afterEach(() => vi.unstubAllGlobals())

describe('localModelPossible — 어디서 로컬 모델을 찾아볼 것인가', () => {
  it('데스크톱 빌드(file://)와 개발 서버에서는 찾아본다', () => {
    expect(localModelPossible({ protocol: 'file:', hostname: '' })).toBe(true)
    expect(localModelPossible({ protocol: 'http:', hostname: 'localhost' })).toBe(true)
    expect(localModelPossible({ protocol: 'http:', hostname: '127.0.0.1' })).toBe(true)
  })
  it('웹 호스팅에서는 찾아보지 않는다', () => {
    for (const h of ['k-kom.itch.io', 'html-classic.itch.zone', 'example.com'])
      expect(localModelPossible({ protocol: 'https:', hostname: h }), h).toBe(false)
  })
})

describe('isAvailable — 방문자를 기다리게 하지 않는다', () => {
  it('웹에서는 네트워크 요청 자체를 하지 않는다', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    vi.stubGlobal('location', { protocol: 'https:', hostname: 'k-kom.itch.io' })
    expect(await isAvailable()).toBe(false)
    expect(f).not.toHaveBeenCalled()
  })
  it('응답이 없으면 시간 제한 뒤 포기한다(영원히 매달리지 않는다)', async () => {
    vi.stubGlobal('location', { protocol: 'http:', hostname: 'localhost' })
    // 방화벽이 요청을 삼키는 상황: abort 신호가 올 때까지 끝나지 않는 fetch
    vi.stubGlobal('fetch', (url, opts) =>
      new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted')))),
    )
    const t0 = Date.now()
    expect(await isAvailable(undefined, undefined, 50)).toBe(false)
    expect(Date.now() - t0).toBeLessThan(1000)
  })
  it('기본 시간 제한이 너무 길지 않다', () => {
    expect(LOCAL_PROBE_TIMEOUT_MS).toBeLessThanOrEqual(3000)
  })
  it('모델이 있으면 true', async () => {
    vi.stubGlobal('location', { protocol: 'file:', hostname: '' })
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ models: [{ name: 'aetheria:latest' }] }) }))
    expect(await isAvailable()).toBe(true)
  })
})
