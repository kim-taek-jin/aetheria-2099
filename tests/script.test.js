// script.js — 손으로 쓴 서사. 모델 출력과 같은 형태여야 기존 시스템(추적 시계,
// 조각 지급, 루트 확정, 엔딩 게이트)이 그대로 통과한다. 그 계약을 고정한다.
import { describe, it, expect } from 'vitest'
import { SCRIPT, hasScript, openingBeat, choiceBeat, evidenceScriptBeat } from '../src/game/script.js'
import { SCENES } from '../src/game/scenes.js'
import { NPCS, EMOTIONS, TONES, CHOICE_TONES } from '../src/game/lore.js'
import { createNewGame, applyResponse } from '../src/game/state.js'

const NODES = Object.keys(SCRIPT)

describe('script — 씬 바이블과 어긋나지 않는다', () => {
  it('모든 authoring 노드가 실제 씬이다', () => {
    for (const id of NODES) expect(SCENES[id], `${id}가 씬 바이블에 없음`).toBeDefined()
  })
  it('화자가 그 씬의 무대 NPC와 일치한다', () => {
    for (const id of NODES) expect(SCRIPT[id].npc).toBe(SCENES[id].npc)
  })
  it('선택의 next가 그 씬의 허용 후속에 있다(끊긴 링크 방지)', () => {
    for (const id of NODES) {
      for (const c of SCRIPT[id].choices) {
        if (!c.next || c.next === id) continue
        expect(SCENES[id].next, `${id} → ${c.next}`).toContain(c.next)
      }
    }
  })
})

describe('script — enum 계약(UI 렌더 안전)', () => {
  it('NPC·감정·톤·선택 톤이 모두 유효하다', () => {
    for (const id of NODES) {
      const s = SCRIPT[id]
      expect(NPCS).toContain(s.npc)
      expect(EMOTIONS).toContain(s.emotion)
      expect(TONES).toContain(s.tone)
      for (const c of s.choices) {
        expect(CHOICE_TONES).toContain(c.tone)
        expect(EMOTIONS).toContain(c.reaction.emotion)
      }
    }
  })
  it('모든 씬은 선택지를 3개 가진다(결말 노드만 자격별 6개)', () => {
    for (const id of NODES) {
      const n = SCRIPT[id].choices.length
      if (SCENES[id].endingChoiceNode) expect(n).toBe(6)
      else expect(n, `${id}`).toBe(3)
    }
  })
})

describe('script — 선택마다 글이 실제로 달라진다(핵심 요구)', () => {
  it('같은 씬의 세 반응 나레이션이 서로 다르다', () => {
    for (const id of NODES) {
      const texts = SCRIPT[id].choices.map((c) => c.reaction.narration)
      expect(new Set(texts).size, `${id}의 반응이 중복`).toBe(texts.length)
    }
  })
  it('같은 씬의 세 반응 대사가 서로 다르다', () => {
    for (const id of NODES) {
      const lines = SCRIPT[id].choices.map((c) => c.reaction.line)
      expect(new Set(lines).size, `${id}의 대사가 중복`).toBe(lines.length)
    }
  })
  it('선택마다 게이지 변화가 동일하지 않다', () => {
    for (const id of NODES) {
      // 결말 노드는 게이지가 의미 없다(엔딩으로 수렴).
      if (SCENES[id].endingChoiceNode) continue
      const fx = SCRIPT[id].choices.map((c) => JSON.stringify(c.effects || {}))
      expect(new Set(fx).size, `${id}의 효과가 전부 같음`).toBeGreaterThan(1)
    }
  })
})

describe('choiceBeat — 모델 출력과 같은 형태', () => {
  const first = NODES[0]
  const firstChoice = SCRIPT[first].choices[0].text

  it('필수 필드를 모두 갖춘다', () => {
    const b = choiceBeat(first, firstChoice)
    for (const k of [
      'narration',
      'npc_name',
      'npc_response',
      'npc_emotion',
      'suspicion_change',
      'affinity_change',
      'heat_change',
      'story_branch',
      'background_tone',
      'generated_choices',
    ]) {
      expect(b[k], `${k} 누락`).toBeDefined()
    }
  })
  it('넘어갈 때 이 선택에 대한 반응 대사를 잃지 않는다', () => {
    const b = choiceBeat(first, firstChoice)
    expect(b.narration).toContain(SCRIPT[first].choices[0].reaction.line)
  })
  it('다음 씬의 선택지를 함께 실어 보낸다', () => {
    const b = choiceBeat(first, firstChoice)
    expect(b.generated_choices).toHaveLength(3)
  })
  it('없는 선택이면 null(모델 경로로 폴백)', () => {
    expect(choiceBeat(first, '내가 지어낸 행동')).toBeNull()
  })
  it('authoring 되지 않은 노드는 null(엔딩 노드는 EndingScreen이 맡는다)', () => {
    expect(choiceBeat('ENDING_SOLO_EXIT', '아무거나')).toBeNull()
    expect(hasScript('ENDING_SOLO_EXIT')).toBe(false)
  })
  it('본편 전 씬이 빠짐없이 authoring 되어 있다', () => {
    const story = Object.keys(SCENES).filter((id) => !id.startsWith('ENDING_'))
    for (const id of story) expect(hasScript(id), `${id} 미작성`).toBe(true)
  })
})

describe('script → 상태머신 통합', () => {
  it('authoring beat이 applyResponse를 그대로 통과한다', () => {
    const s = createNewGame()
    const b = choiceBeat('PROLOGUE_RAIN_01', SCRIPT.PROLOGUE_RAIN_01.choices[1].text)
    const n = applyResponse(s, b, '조사')
    expect(n.currentNode).toBe('PROLOGUE_CHOICE_01')
    // 추적 시계(+3)와 선택 효과(+4)가 함께 적용된다.
    expect(n.heat).toBe(7)
    // 진입 시 '빈자리' 조각이 지급된다(진엔딩 경로가 살아있다).
    expect(n.fragments.some((f) => f.includes('빈자리 #1'))).toBe(true)
  })
  it('도입 beat은 제자리에 머문다', () => {
    expect(openingBeat('PROLOGUE_RAIN_01').story_branch).toBe('PROLOGUE_RAIN_01')
  })
})

describe('script — 전 루트 완주 가능성(끊긴 곳 없이 결말까지)', () => {
  it('세 루트 모두 authoring 만으로 결말 노드까지 닿는다', () => {
    for (const start of ['ACT2_REN_AUCTION_01', 'ACT2_KAEL_INTERROGATION_01', 'ACT2_ECHO_BROADCAST_01']) {
      let node = start
      const seen = new Set()
      while (SCRIPT[node] && !seen.has(node)) {
        seen.add(node)
        node = SCRIPT[node].choices[0].next
      }
      expect(node, `${start} 루트가 결말에 못 닿음`).toMatch(/^ENDING_/)
    }
  })
  it('프롤로그에서 시작해도 결말까지 이어진다', () => {
    let node = 'PROLOGUE_RAIN_01'
    const seen = new Set()
    while (SCRIPT[node] && !seen.has(node)) {
      seen.add(node)
      node = SCRIPT[node].choices[0].next
    }
    expect(node).toMatch(/^ENDING_/)
  })
})

describe('script — byRoute(동행별 장면)', () => {
  it('마지막 격벽 씬이 동행에 따라 달라진다', () => {
    const texts = ['Ren', 'Kael', 'Echo'].map((r) => openingBeat('ACT3_VIGIL_01', r).npc_response)
    expect(new Set(texts).size).toBe(3)
  })
  it('루트가 없으면 기본 장면으로 폴백한다', () => {
    expect(openingBeat('ACT3_VIGIL_01').npc_response).toBeTruthy()
  })
})

describe('script — 루트를 고르기 전에 세 인물을 만나야 한다', () => {
  it('분기 씬에서 렌·카엘·에코가 모두 목소리를 낸다', () => {
    // 이게 없으면 얼굴도 모르는 둘 중에서 고르라는 꼴이 된다 —
    // 게임 최대의 선택을 눈 감고 하게 만드는 설계 결함이었다.
    const n = SCRIPT.ACT1_SKY_GLITCH_01.narration
    for (const who of ['렌 —', '카엘 —', '에코 —']) {
      expect(n, `${who} 대사가 분기 전에 없음`).toContain(who)
    }
  })
  it('세 선택지가 각 세력의 Act2로 정확히 이어진다', () => {
    const map = Object.fromEntries(SCRIPT.ACT1_SKY_GLITCH_01.choices.map((c) => [c.tone, c.next]))
    expect(map.Deceptive).toBe('ACT2_REN_AUCTION_01')
    expect(map.Honest).toBe('ACT2_KAEL_INTERROGATION_01')
    expect(map.Aggressive).toBe('ACT2_ECHO_BROADCAST_01')
  })
})

describe('script — 고르지 않은 세력도 무대에 오른다', () => {
  const MID = {
    ACT2_REN_BACKROOM_01: { rival: 'Kael', 이름: '카엘' },
    ACT2_KAEL_HOLDING_01: { rival: 'Echo', 이름: '에코' },
    ACT2_ECHO_MARTYR_01: { rival: 'Ren', 이름: '렌' },
  }
  it('각 루트 중반에 상대 세력이 직접 말을 건다', () => {
    // 없으면 고르지 않은 두 세력의 게이지가 끝까지 장식으로 남는다.
    for (const [node, { 이름 }] of Object.entries(MID)) {
      expect(SCRIPT[node].narration, `${node}에 ${이름} 개입 없음`).toContain(`${이름} —`)
    }
  })
  it('그 응답이 상대 세력 게이지를 실제로 움직인다', () => {
    for (const [node, { rival }] of Object.entries(MID)) {
      const withRival = SCRIPT[node].choices.filter((c) => c.rivalEffects?.npc === rival)
      expect(withRival.length, `${node}`).toBeGreaterThanOrEqual(2)
    }
  })
  it('상대에게 기우는 선택과 등지는 선택이 모두 있다', () => {
    for (const [node, { rival }] of Object.entries(MID)) {
      const deltas = SCRIPT[node].choices
        .filter((c) => c.rivalEffects?.npc === rival)
        .map((c) => c.rivalEffects.affinity_change ?? 0)
      expect(Math.max(...deltas), `${node}`).toBeGreaterThan(0)
      expect(Math.min(...deltas), `${node}`).toBeLessThan(0)
    }
  })
})

describe('script — AI 없이도 완주된다(무료 웹 공개 조건)', () => {
  it('엔딩을 제외한 모든 씬이 authoring 되어 있다', () => {
    // App의 playable = hasScript(현재씬) || aiReady 이므로, 이 불변식이 곧
    // "Ollama도 API 키도 없는 방문자가 처음부터 끝까지 플레이할 수 있다"는 뜻이다.
    // 깨지면 방문자가 손으로 쓴 게임 대신 옛 데모를 보게 된다.
    for (const id of Object.keys(SCENES).filter((k) => !k.startsWith('ENDING_'))) {
      expect(hasScript(id), `${id} 미작성 → 그 씬에서 AI가 필요해진다`).toBe(true)
    }
  })
  it('증거 제시도 손으로 쓴 반응을 가진다(AI 불필요)', () => {
    for (const v of ['hit', 'miss']) {
      const b = evidenceScriptBeat('ACT2_KAEL_HOLDING_01', v)
      expect(b.npc_response.length).toBeGreaterThan(8)
      expect(b.evidence_result).toBe(v)
      expect(b.story_branch).toBe('ACT2_KAEL_HOLDING_01')
    }
  })
})

describe('script — 고른 편이 깨끗하지 않다(Act2 루트 깊이)', () => {
  // 루트가 3장면이면 "이 편을 골랐다"는 실감이 없다. 각 루트에 진실 장면과
  // 대가 장면을 넣었고, 이 구조가 나중에 손보다 빠지지 않게 고정한다.
  const ROUTES = {
    Ren: { start: 'ACT2_REN_AUCTION_01', added: ['ACT2_REN_LEDGER_01', 'ACT2_REN_SPLIT_01'] },
    Kael: { start: 'ACT2_KAEL_INTERROGATION_01', added: ['ACT2_KAEL_ARCHIVE_01', 'ACT2_KAEL_ORDER_01'] },
    Echo: { start: 'ACT2_ECHO_BROADCAST_01', added: ['ACT2_ECHO_SIGNAL_01', 'ACT2_ECHO_COUNT_01'] },
  }
  const pathOf = (start) => {
    const seen = []
    let node = start
    while (node.startsWith('ACT2_') && !seen.includes(node)) {
      seen.push(node)
      node = SCRIPT[node].choices[0].next
    }
    return { seen, exit: node }
  }

  it('각 루트는 Act3 전에 5장면을 지난다', () => {
    for (const [r, { start }] of Object.entries(ROUTES)) {
      const { seen, exit } = pathOf(start)
      expect(seen.length, `${r}: ${seen.join(' → ')}`).toBe(5)
      expect(exit).toBe('ACT3_CORE_APPROACH_01')
    }
  })
  it('추가 장면이 어느 선택으로 가도 건너뛰어지지 않는다', () => {
    for (const [r, { start, added }] of Object.entries(ROUTES)) {
      // 모든 선택이 같은 next를 갖는지 — 하나라도 다르면 지름길이 생긴다.
      for (const id of pathOf(start).seen) {
        const nexts = new Set(SCRIPT[id].choices.map((c) => c.next))
        expect(nexts.size, `${r}/${id}에 갈림길`).toBe(1)
      }
      for (const id of added) expect(pathOf(start).seen, r).toContain(id)
    }
  })
  it('추가 장면은 화자가 그 루트의 인물이다', () => {
    for (const [r, { added }] of Object.entries(ROUTES)) {
      for (const id of added) expect(SCRIPT[id].npc).toBe(r)
    }
  })
})
