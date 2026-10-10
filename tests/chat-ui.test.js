// 대사를 말풍선 여러 개로 끊는 규칙. 채팅 게임의 리듬을 만드는 핵심이라,
// "한 단어짜리 말풍선"이나 "너무 잘게 쪼갬"이 생기지 않는지 지킨다.
import { describe, it, expect } from 'vitest'
import { splitLine } from '../src/components/MainScreen.jsx'
import { SCRIPT } from '../src/game/script.js'

describe('splitLine — 말풍선 분할', () => {
  it('빈 입력은 빈 목록', () => {
    expect(splitLine('')).toEqual([])
    expect(splitLine(null)).toEqual([])
  })
  it('짧은 한 문장은 쪼개지 않는다', () => {
    expect(splitLine('값을 못 매기겠다.')).toHaveLength(1)
  })
  it('문장 경계에서 끊는다', () => {
    const out = splitLine('여기서부터는 내 장비로 안 돼. 상위 접근 권한을 빌려야 하는데, 그건 내 이름으로 빌리는 거야. 즉 이 순간부터 위험은 내 장부에도 올라간다는 뜻이지.')
    expect(out.length).toBeGreaterThan(1)
    expect(out.join(' ')).toContain('내 장부에도 올라간다는 뜻이지.')
  })
  it('말풍선은 최대 3개 — 턴이 늘어지지 않게', () => {
    const many = Array.from({ length: 12 }, (_, i) => `이것은 ${i}번째로 충분히 긴 문장입니다.`).join(' ')
    expect(splitLine(many).length).toBeLessThanOrEqual(3)
  })
  it('짧은 토막은 앞에 붙여 한 단어짜리 말풍선을 만들지 않는다', () => {
    for (const seg of splitLine('그래. 알았어. 그럼 오늘은 굶는 걸로 하자. 내일 값은 내일 치자고.')) {
      expect(seg.length, seg).toBeGreaterThan(5)
    }
  })
  it('본문의 모든 대사가 규칙을 지킨다 — 글자가 사라지지 않는다', () => {
    for (const [id, node] of Object.entries(SCRIPT)) {
      if (!node.line) continue
      const out = splitLine(node.line)
      expect(out.length, id).toBeLessThanOrEqual(3)
      // 분할해도 내용은 그대로여야 한다(공백만 달라질 수 있다).
      const norm = (x) => String(x).replace(/\s+/g, '')
      expect(norm(out.join('')), id).toBe(norm(node.line))
    }
  })
})
