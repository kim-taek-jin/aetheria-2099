// 자유 입력의 판단 백엔드 — 내 모델(Ollama)이 없으면 플레이어의 Gemini 키가
// 같은 일을 넘겨받는다. 웹(itch.io)에서 "키를 넣으면 자유 입력이 더 자유로워진다"는
// 안내가 사실이려면 이 경로가 살아 있어야 한다.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { complete, classifyIntent, resolveIntent, answerWithModelGated } from '../src/services/intent.js'

const CHOICES = [
  { text: '[솔직하게] 털어놓는다.', tone: 'Honest' },
  { text: '[거짓말] 둘러댄다.', tone: 'Deceptive' },
  { text: '[도발] 쏘아붙인다.', tone: 'Aggressive' },
]
const GEMINI = { kind: 'gemini', apiKey: 'test-key' }

function mockFetch(reply) {
  const fn = vi.fn(async () => ({ ok: true, json: async () => reply }))
  vi.stubGlobal('fetch', fn)
  return fn
}
const geminiReply = (...parts) => ({ candidates: [{ content: { parts } }] })

afterEach(() => vi.unstubAllGlobals())

describe('judge backend — Gemini', () => {
  it('Gemini 엔드포인트로 키와 함께 보낸다(Ollama로 가지 않는다)', async () => {
    const f = mockFetch(geminiReply({ text: '1' }))
    await complete({ prompt: 'p', backend: GEMINI })
    const [url, init] = f.mock.calls[0]
    expect(url).toContain('generativelanguage.googleapis.com')
    expect(url).toContain('key=test-key')
    expect(url).not.toContain('11434')
    // 생각 토큰이 한도를 먹어 빈 응답이 나지 않도록 여유를 둔다.
    expect(JSON.parse(init.body).generationConfig.maxOutputTokens).toBeGreaterThanOrEqual(512)
  })
  it('생각(thought) 파트는 버리고 실제 출력만 쓴다', async () => {
    mockFetch(geminiReply({ text: '음 두 번째 같다', thought: true }, { text: '1' }))
    expect(await complete({ prompt: 'p', backend: GEMINI })).toBe('1')
  })
  it('의도 분류가 Gemini로 동작한다', async () => {
    mockFetch(geminiReply({ text: '2' }))
    expect(await classifyIntent({ text: '렌을 몰아세운다', choices: CHOICES, backend: GEMINI })).toBe(2)
  })
  it('키가 비어 있으면 호출하지 않고 null', async () => {
    const f = mockFetch(geminiReply({ text: '0' }))
    expect(await complete({ prompt: 'p', backend: { kind: 'gemini', apiKey: '' } })).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  it('Gemini가 실패하면 키워드 규칙으로 떨어진다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })))
    expect(await resolveIntent({ text: '솔직하게 다 털어놓는다', choices: CHOICES, backend: GEMINI })).toBe(0)
  })
  it('Gemini 답변도 품질 게이트를 거친다', async () => {
    mockFetch(geminiReply({ text: '{"npc_response": "깨진 출력"}' }))
    expect(await answerWithModelGated({ npc: '렌', question: '오늘 날씨 어때?', backend: GEMINI })).toBeNull()
    mockFetch(geminiReply({ text: '날씨 같은 건 값이 안 나와. 칩 얘기나 하자.' }))
    expect(await answerWithModelGated({ npc: '렌', question: '오늘 날씨 어때?', backend: GEMINI })).toBe(
      '날씨 같은 건 값이 안 나와. 칩 얘기나 하자.',
    )
  })
})

describe('judge backend — Ollama(기본값)는 그대로', () => {
  it('백엔드를 안 주면 로컬 Ollama로 간다', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ response: '0' }) }))
    vi.stubGlobal('fetch', f)
    expect(await classifyIntent({ text: 'x', choices: CHOICES })).toBe(0)
    const [url, init] = f.mock.calls[0]
    expect(url).toContain('/api/generate')
    expect(JSON.parse(init.body).options).toMatchObject({ temperature: 0, num_predict: 5 })
  })
})
