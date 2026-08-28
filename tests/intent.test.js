// intent.js — 자유 입력을 authoring 선택지로 분류.
// 모델 호출은 테스트에서 제외하고, 모델이 없을 때의 규칙 기반 폴백과
// nudge(해당 없음) 경로를 검증한다. 이 둘이 무너지면 자유 입력이 다시
// 모델 산문으로 흘러가 품질이 깨진다.
import { describe, it, expect } from 'vitest'
import { classifyByKeyword, answerPassesGate } from '../src/services/intent.js'
import { SCRIPT, nudgeBeat, askBeat } from '../src/game/script.js'
import { ANSWERS, DEFLECT, TOPICS, looksLikeQuestion, topicByKeyword, pickDeflect } from '../src/game/answers.js'
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

describe('answers — 물으면 답한다(플레이어가 중심이 되는 층)', () => {
  it('질문형 입력을 알아본다', () => {
    for (const q of ['칩이 뭐야?', '너는 누구지', '왜 그렇게 생각해', '바깥에 뭐가 있어']) {
      expect(looksLikeQuestion(q), q).toBe(true)
    }
  })
  it('물음표도 의문사도 없는 한국어 질문형을 놓치지 않는다', () => {
    // 이걸 놓치면 질문이 행동으로 처리돼 장면이 넘어간다(= 물어봤는데 답이 없다).
    for (const q of ['칩에 대해 설명해줘', '네 얘기 좀 해봐', '바깥 얘기 알려줘', '배달원 궁금해', '말해봐']) {
      expect(looksLikeQuestion(q), q).toBe(true)
    }
  })
  it('행동 서술은 질문으로 보지 않는다', () => {
    for (const a of ['칩을 주머니에 넣는다', '조용히 물러난다', '단말을 뽑는다', '렌에게 칩을 건넨다', '골목을 벗어난다']) {
      expect(looksLikeQuestion(a), a).toBe(false)
    }
  })
  it('키워드로 주제를 고른다', () => {
    expect(topicByKeyword('이 칩이 뭔데?')).toBe('chip')
    expect(topicByKeyword('장벽 바깥에 진짜 숲이 있어?')).toBe('outside')
    expect(topicByKeyword('내 지워진 3년은 뭐야')).toBe('past')
    expect(topicByKeyword('그 배달원은 누구였어')).toBe('courier')
  })
  it('같은 주제라도 인물마다 다르게 답한다', () => {
    const lines = ['Ren', 'Kael', 'Echo', 'NEXUS'].map((n) => ANSWERS[n].outside.line)
    expect(new Set(lines).size).toBe(4)
  })
  it('네 화자가 모든 주제에 답을 가진다(빈 구멍 없음)', () => {
    for (const npc of ['Ren', 'Kael', 'Echo', 'NEXUS']) {
      for (const t of TOPICS) {
        expect(ANSWERS[npc][t]?.line, `${npc}/${t} 누락`).toBeTruthy()
      }
    }
  })
  it('답변 beat은 씬을 진전시키지도 게이지를 건드리지도 않는다', () => {
    const b = askBeat('ACT1_REN_GARAGE_01', 'chip')
    expect(b.story_branch).toBe('ACT1_REN_GARAGE_01')
    expect(b.suspicion_change).toBe(0)
    expect(b.affinity_change).toBe(0)
    expect(b.generated_choices).toHaveLength(3)
  })
  it('주제를 못 찾아도 인물다운 회피로 답한다', () => {
    const b = askBeat('ACT1_REN_GARAGE_01', 'nonexistent_topic')
    expect(DEFLECT.Ren).toContain(b.npc_response)
  })
  it('회피는 여러 개라 반복이 티나지 않는다', () => {
    for (const npc of ['Ren', 'Kael', 'Echo', 'NEXUS']) {
      expect(DEFLECT[npc].length).toBeGreaterThanOrEqual(3)
      expect(new Set(DEFLECT[npc]).size).toBe(DEFLECT[npc].length)
    }
    const seeds = ['우주는 뭐야', '좋아하는 색은', '저녁 뭐 먹었어', '노래 불러줘', '고양이 있어']
    expect(new Set(seeds.map((q) => pickDeflect('Ren', q))).size).toBeGreaterThan(1)
  })
  it('같은 질문에는 같은 회피(일관성)', () => {
    expect(pickDeflect('Kael', '우주는 뭐야')).toBe(pickDeflect('Kael', '우주는 뭐야'))
  })
  it('주제가 20개로 늘었고 네 화자가 모두 답한다', () => {
    expect(TOPICS.length).toBe(20)
    for (const npc of ['Ren', 'Kael', 'Echo', 'NEXUS']) {
      for (const t of TOPICS) expect(ANSWERS[npc][t]?.line, `${npc}/${t}`).toBeTruthy()
    }
  })
  it('흥정·협상 질문이 올바른 주제로 간다', () => {
    expect(topicByKeyword('이 데이터의 가격을 얼마라고 생각해')).toBe('price')
    expect(topicByKeyword('얼마에 살껀데?')).toBe('price')
    expect(topicByKeyword('지분은 얼마나 줄 건데')).toBe('deal')
    expect(topicByKeyword('다른 사람한테 맡기면 안 돼?')).toBe('elsewhere')
    expect(topicByKeyword('시간 얼마나 남았어')).toBe('time') // '얼마'가 price를 먹지 않는다
  })
})

describe('answerPassesGate — 모델 답변은 통과한 것만 화면에 낸다', () => {
  it('정상적인 한두 문장은 통과', () => {
    expect(answerPassesGate('값을 못 매기는 물건이야. 그게 다야.')).toBe(true)
  })
  it('너무 짧거나 긴 것은 막는다', () => {
    expect(answerPassesGate('응')).toBe(false)
    expect(answerPassesGate('가'.repeat(200))).toBe(false)
  })
  it('JSON 누출을 막는다', () => {
    expect(answerPassesGate('{"npc_response":"안녕하세요 시민 제인"}')).toBe(false)
    expect(answerPassesGate('그래 알겠어 suspicion_change 를 올린다')).toBe(false)
  })
  it('여러 줄은 대사가 아니므로 막는다', () => {
    expect(answerPassesGate('첫 줄이다\n둘째 줄이다')).toBe(false)
  })
  it('한글 비율이 낮으면 막는다', () => {
    expect(answerPassesGate('leanor crypto Dollar signs okay then')).toBe(false)
  })
  it('깨짐 검출기를 함께 쓰면 라틴 덩어리를 막는다', () => {
    const garble = (t) => /[A-Za-z]{4,}/.test(t)
    expect(answerPassesGate('연기를 재면 2년이leanor 가까워졌거든', garble)).toBe(false)
  })
})
