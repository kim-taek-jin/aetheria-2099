// aiRouter.js — 하이브리드 라우팅/폴백 순수 로직 테스트.
import { describe, it, expect, vi } from 'vitest'
import { routeBeat, isTransient } from '../src/services/aiRouter.js'

const ok = (tag) => ({ ok: true, data: { tag } })
const fail = (code) => ({ ok: false, code })
const base = { save: {}, playerInput: 'x', signal: undefined }

describe('isTransient', () => {
  it('일시적 코드만 true', () => {
    expect(isTransient('RATE_LIMIT')).toBe(true)
    expect(isTransient('HTTP')).toBe(true)
    expect(isTransient('NETWORK')).toBe(true)
    expect(isTransient('BAD_KEY')).toBe(false)
    expect(isTransient('NO_KEY')).toBe(false)
  })
})

describe('routeBeat — 정상 경로', () => {
  it('키가 있으면 클라우드(Gemini)를 쓴다', async () => {
    const gemini = vi.fn(async () => ok('cloud'))
    const local = vi.fn(async () => ok('local'))
    const { res, via } = await routeBeat({ apiKey: 'k', ollamaOn: true, ...base, gemini, local })
    expect(via).toBe('cloud')
    expect(res.data.tag).toBe('cloud')
    expect(gemini).toHaveBeenCalledOnce()
    expect(local).not.toHaveBeenCalled()
  })

  it('키가 없으면 로컬 자체모델을 쓴다', async () => {
    const gemini = vi.fn(async () => ok('cloud'))
    const local = vi.fn(async () => ok('local'))
    const { res, via } = await routeBeat({ apiKey: '', ollamaOn: true, ...base, gemini, local })
    expect(via).toBe('local')
    expect(res.data.tag).toBe('local')
    expect(gemini).not.toHaveBeenCalled()
  })
})

describe('routeBeat — 폴백', () => {
  it('클라우드가 RATE_LIMIT이고 로컬이 있으면 로컬로 전환', async () => {
    const gemini = vi.fn(async () => fail('RATE_LIMIT'))
    const local = vi.fn(async () => ok('local'))
    const { res, via } = await routeBeat({ apiKey: 'k', ollamaOn: true, ...base, gemini, local })
    expect(via).toBe('local-fallback')
    expect(res.ok).toBe(true)
    expect(local).toHaveBeenCalledOnce()
  })

  it('로컬이 없으면 원래 실패를 그대로 반환(비상 비트는 호출부 몫)', async () => {
    const gemini = vi.fn(async () => fail('RATE_LIMIT'))
    const local = vi.fn(async () => ok('local'))
    const { res, via } = await routeBeat({ apiKey: 'k', ollamaOn: false, ...base, gemini, local })
    expect(via).toBe('cloud')
    expect(res.ok).toBe(false)
    expect(local).not.toHaveBeenCalled()
  })

  it('BAD_KEY는 폴백하지 않는다(키 수정 유도)', async () => {
    const gemini = vi.fn(async () => fail('BAD_KEY'))
    const local = vi.fn(async () => ok('local'))
    const { res, via } = await routeBeat({ apiKey: 'k', ollamaOn: true, ...base, gemini, local })
    expect(via).toBe('cloud')
    expect(res.code).toBe('BAD_KEY')
    expect(local).not.toHaveBeenCalled()
  })

  it('폴백한 로컬마저 실패하면 원래(클라우드) 실패 반환', async () => {
    const gemini = vi.fn(async () => fail('HTTP'))
    const local = vi.fn(async () => fail('NETWORK'))
    const { res, via } = await routeBeat({ apiKey: 'k', ollamaOn: true, ...base, gemini, local })
    expect(via).toBe('cloud')
    expect(res.code).toBe('HTTP')
  })
})
