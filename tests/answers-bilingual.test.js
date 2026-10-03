// 방문자가 실제로 치는 말 — 한국어·영어 모두. 회피만 돌아오면
// "못 알아듣는구나"가 바로 들통나므로, 흔한 말일수록 제 주제로 가야 한다.
import { describe, it, expect } from 'vitest'
import {
  TOPICS,
  ANSWERS,
  DEFLECT,
  EVIDENCE_REACT,
  topicByKeyword,
  looksLikeQuestion,
  answerBeat,
  pickDeflect,
  evidenceBeat,
} from '../src/game/answers.js'
import { ANSWERS_EN, DEFLECT_EN, EVIDENCE_REACT_EN, TOPIC_KEYWORDS_EN } from '../src/game/answers.en.js'

const NPCS = ['Ren', 'Kael', 'Echo', 'NEXUS']

describe('답변 — 두 언어가 같은 범위를 덮는다', () => {
  it('영어 키워드가 모든 주제에 있다', () => {
    for (const t of TOPICS) expect(TOPIC_KEYWORDS_EN[t]?.length, t).toBeGreaterThan(0)
    expect(Object.keys(TOPIC_KEYWORDS_EN).sort()).toEqual([...TOPICS].sort())
  })
  it('모든 인물 × 모든 주제에 한국어·영어 답이 있다', () => {
    for (const npc of NPCS) {
      for (const t of TOPICS) {
        expect(ANSWERS[npc][t]?.line, `ko ${npc}/${t}`).toBeTruthy()
        expect(ANSWERS_EN[npc][t]?.line, `en ${npc}/${t}`).toBeTruthy()
      }
    }
  })
  it('지문(narration)이 있으면 두 언어 모두 있다', () => {
    for (const npc of NPCS)
      for (const t of TOPICS)
        expect(Boolean(ANSWERS[npc][t].narration), `${npc}/${t}`).toBe(Boolean(ANSWERS_EN[npc][t].narration))
  })
  it('영어 답에 한글이 섞이지 않고, 한국어 답은 한글이다', () => {
    for (const npc of NPCS)
      for (const t of TOPICS) {
        expect(ANSWERS_EN[npc][t].line, `${npc}/${t}`).not.toMatch(/[가-힣]/)
        expect(ANSWERS[npc][t].line, `${npc}/${t}`).toMatch(/[가-힣]/)
      }
  })
  it('같은 인물 안에서 답이 겹치지 않는다', () => {
    for (const npc of NPCS) {
      for (const table of [ANSWERS, ANSWERS_EN]) {
        const lines = TOPICS.map((t) => table[npc][t].line)
        expect(new Set(lines).size, npc).toBe(lines.length)
      }
    }
  })
  it('회피는 인물당 8개, 두 언어 같은 수', () => {
    for (const npc of NPCS) {
      expect(DEFLECT[npc]).toHaveLength(8)
      expect(DEFLECT_EN[npc]).toHaveLength(8)
    }
  })
  it('증거 반응도 두 언어', () => {
    for (const npc of NPCS) for (const v of ['hit', 'miss']) {
      expect(EVIDENCE_REACT[npc][v].line).toBeTruthy()
      expect(EVIDENCE_REACT_EN[npc][v].line).toBeTruthy()
    }
  })
})

describe('흔한 말이 제 주제로 간다 — 한국어', () => {
  const cases = {
    '안녕': 'greet',
    '이름이 뭐야?': 'name',
    '고마워': 'thanks',
    '미안해': 'sorry',
    '이 바보야': 'insult',
    '나 너 좋아해': 'flirt',
    '기분 어때?': 'feel',
    '무섭지 않아?': 'fear',
    '가족 있어?': 'family',
    '꿈이 뭐야': 'dream',
    '죽으면 어떻게 돼?': 'death',
    '진실을 말해': 'truth',
    '자유가 뭔데': 'freedom',
    '돈이 필요해?': 'money',
    '비가 오네': 'weather',
    '배고파': 'food',
    '피곤하지 않아?': 'sleep',
    '농담 좀 해봐': 'joke',
    '노래 좋아해?': 'music',
    '집이 어디야? 집에 가고 싶어': 'home',
    '나 뭘 해야 돼?': 'advice',
  }
  for (const [text, topic] of Object.entries(cases)) {
    it(`"${text}" → ${topic}`, () => expect(topicByKeyword(text)).toBe(topic))
  }
})

describe('흔한 말이 제 주제로 간다 — English', () => {
  const cases = {
    'hello': 'greet',
    "what's your name?": 'name',
    'thank you': 'thanks',
    "I'm sorry": 'sorry',
    "you're an idiot": 'insult',
    'I think I love you': 'flirt',
    'how are you?': 'feel',
    'are you scared?': 'fear',
    'do you have a family?': 'family',
    "what's your dream?": 'dream',
    'what happens after death?': 'death',
    'tell me the truth': 'truth',
    'what does freedom mean to you': 'freedom',
    'do you need money?': 'money',
    "it's raining again": 'weather',
    "I'm hungry": 'food',
    'are you tired?': 'sleep',
    'tell me a joke': 'joke',
    'do you like music?': 'music',
    'where is your home?': 'home',
    'what should i do?': 'advice',
    'how much is this chip worth?': 'price',
    'what is NEXUS?': 'nexus',
    'how do we escape?': 'escape',
    'can I trust you?': 'trust',
  }
  for (const [text, topic] of Object.entries(cases)) {
    it(`"${text}" → ${topic}`, () => expect(topicByKeyword(text)).toBe(topic))
  }
  it('"ai"가 다른 단어 속에서 NEXUS로 잡히지 않는다', () => {
    expect(topicByKeyword('I said wait again')).not.toBe('nexus')
  })
})

describe('영어 질문 판별', () => {
  for (const q of ['who are you', 'Why did you do that', 'is this real', 'tell me about the chip', 'can we escape'])
    it(`질문: "${q}"`, () => expect(looksLikeQuestion(q)).toBe(true))
  for (const a of ['I grab the chip and run', 'Lie to him', 'hack the terminal'])
    it(`행동: "${a}"`, () => expect(looksLikeQuestion(a)).toBe(false))
})

describe('beat이 언어를 따른다', () => {
  it('영어면 영어 답, 한국어면 한국어 답', () => {
    expect(answerBeat('Ren', 'greet', null, '', 'en').npc_response).toBe(ANSWERS_EN.Ren.greet.line)
    expect(answerBeat('Ren', 'greet', null, '', 'ko').npc_response).toBe(ANSWERS.Ren.greet.line)
  })
  it('주제가 없으면 그 언어의 회피', () => {
    expect(DEFLECT_EN.Kael).toContain(answerBeat('Kael', null, null, 'zzz', 'en').npc_response)
    expect(DEFLECT.Kael).toContain(pickDeflect('Kael', 'zzz', 'ko'))
  })
  it('증거 반응도 언어를 따른다', () => {
    expect(evidenceBeat('Echo', 'hit', null, 'en').npc_response).toBe(EVIDENCE_REACT_EN.Echo.hit.line)
  })
})
