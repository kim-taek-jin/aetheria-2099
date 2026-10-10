// 답변 1,000개 이상(언어당) — 화제 81개 × 인물 4명 × 답 3개 + 회피 + 증거 반응.
// 같은 화제를 다시 물으면 다른 답이 나와야 "또 같은 말"이 안 들킨다.
import { describe, it, expect } from 'vitest'
import {
  TOPICS,
  DEFLECT,
  DEFLECT_EN,
  EVIDENCE_REACT,
  answerList,
  answerBeat,
  topicByKeyword,
} from '../src/game/answers.js'
import { EVIDENCE_REACT_EN } from '../src/game/answers.en.js'
import { VARIANTS } from '../src/game/answers/index.js'

const NPCS = ['Ren', 'Kael', 'Echo', 'NEXUS']
const HANGUL = /[가-힣]/

describe('답변 변형 — 범위', () => {
  it('화제가 80개 이상이다', () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(80)
  })
  it('변형 파일의 화제 이름이 실제 화제와 일치한다(오타 방지)', () => {
    for (const lang of ['ko', 'en'])
      for (const npc of NPCS)
        for (const t of Object.keys(VARIANTS[lang][npc])) expect(TOPICS, `${lang}/${npc}/${t}`).toContain(t)
  })
  it('모든 인물 × 모든 화제 × 두 언어에 답이 정확히 3개', () => {
    for (const lang of ['ko', 'en'])
      for (const npc of NPCS)
        for (const t of TOPICS) expect(answerList(npc, t, lang).length, `${lang}/${npc}/${t}`).toBe(3)
  })
  it('언어당 1,000개 이상', () => {
    for (const [lang, deflect, ev] of [
      ['ko', DEFLECT, EVIDENCE_REACT],
      ['en', DEFLECT_EN, EVIDENCE_REACT_EN],
    ]) {
      const answers = NPCS.reduce((n, npc) => n + TOPICS.reduce((m, t) => m + answerList(npc, t, lang).length, 0), 0)
      const deflects = NPCS.reduce((n, npc) => n + deflect[npc].length, 0)
      const evidence = NPCS.length * 2
      expect(answers + deflects + evidence, lang).toBeGreaterThanOrEqual(1000)
      expect(Object.keys(ev)).toHaveLength(4)
    }
  })
})

describe('답변 변형 — 품질', () => {
  it('한 인물 안에서 같은 답이 두 번 나오지 않는다', () => {
    for (const lang of ['ko', 'en'])
      for (const npc of NPCS) {
        const lines = TOPICS.flatMap((t) => answerList(npc, t, lang).map((a) => a.line))
        const dup = lines.filter((l, i) => lines.indexOf(l) !== i)
        expect(dup, `${lang}/${npc}`).toEqual([])
      }
  })
  it('영어 답엔 한글이 없고 한국어 답엔 한글이 있다', () => {
    for (const npc of NPCS)
      for (const t of TOPICS) {
        for (const a of answerList(npc, t, 'en')) expect(a.line, `${npc}/${t}`).not.toMatch(HANGUL)
        for (const a of answerList(npc, t, 'ko')) expect(a.line, `${npc}/${t}`).toMatch(HANGUL)
      }
  })
  it('답이 너무 짧거나 길지 않다(대사 한두 마디)', () => {
    for (const lang of ['ko', 'en'])
      for (const npc of NPCS)
        for (const t of TOPICS)
          for (const a of answerList(npc, t, lang)) {
            expect(a.line.length, `${lang}/${npc}/${t}`).toBeGreaterThan(5)
            expect(a.line.length, `${lang}/${npc}/${t}`).toBeLessThan(lang === 'en' ? 260 : 130)
          }
  })
})

describe('같은 질문을 다시 하면 다른 답', () => {
  it('턴이 바뀌면 같은 질문에도 답이 돌아간다', () => {
    const seen = new Set()
    for (let turn = 0; turn < 12; turn++) seen.add(answerBeat('Ren', 'chip', null, `칩이 뭐야?#${turn}`, 'ko').npc_response)
    expect(seen.size).toBe(3)
  })
  it('같은 턴의 같은 질문은 같은 답(일관성)', () => {
    const a = answerBeat('Echo', 'dream', null, 'dream#4', 'en').npc_response
    const b = answerBeat('Echo', 'dream', null, 'dream#4', 'en').npc_response
    expect(a).toBe(b)
  })
})

describe('새 화제로 간다 — 한국어', () => {
  const cases = {
    '너 몇 살이야?': 'age',
    '여기 어디야?': 'place',
    '리엔이 누구야': 'lien',
    '아렌을 알아?': 'aren',
    '돔은 왜 있어': 'dome',
    '대붕괴 때 무슨 일이 있었어': 'collapse',
    '보안국은 뭐 하는 데야': 'guard',
    '반군은 어떤 사람들이야': 'rebels',
    '경매는 어떻게 해': 'auction',
    '장부 보여줘': 'ledger',
    '도와줘 제발': 'help_me',
    '우리 같이 가자': 'together',
    '나 그냥 가도 돼?': 'leave',
    '나 다쳤어': 'hurt',
    '날 죽일 거야?': 'kill',
    '지금 거짓말하는 거지?': 'lying',
    '비밀 있어?': 'secret',
    '후회하는 거 있어?': 'regret',
    '행복해?': 'happy',
    '사랑해 본 적 있어?': 'love',
    '신을 믿어?': 'god',
    '희망이 있을까': 'hope',
    '제일 좋아하는 게 뭐야': 'favorite',
    '제일 싫어하는 건?': 'hate',
    '어린 시절은 어땠어': 'childhood',
    '친구 있어?': 'friend',
    '술 한잔 할래?': 'drink',
    '아침이 오면 뭐 해': 'morning',
    '오늘 밤은 길겠네': 'night',
    '약속해 줘': 'promise',
    '잘 가': 'goodbye',
    '너 진짜 멋있다': 'compliment',
    '삶의 의미가 뭘까': 'meaning',
    '너 진짜야?': 'real',
    '이거 게임이야?': 'meta',
    '고양이 좋아해?': 'animal',
    '바다 본 적 있어?': 'ocean',
    '별을 본 적 있어?': 'stars',
    '심심해': 'bored',
  }
  for (const [text, topic] of Object.entries(cases)) it(`"${text}" → ${topic}`, () => expect(topicByKeyword(text)).toBe(topic))
  it('"아파트"는 다친 게 아니다', () => expect(topicByKeyword('아파트 살아?')).not.toBe('hurt'))
  it('"기술"은 술이 아니다', () => expect(topicByKeyword('무슨 기술이야')).not.toBe('drink'))
})

describe('새 화제로 간다 — English', () => {
  const cases = {
    'how old are you?': 'age',
    'where are we?': 'place',
    'who is Lien?': 'lien',
    'do you know Aren?': 'aren',
    'why does the dome exist': 'dome',
    'what happened in the collapse?': 'collapse',
    'what do the guards do': 'guard',
    'who are the rebels': 'rebels',
    'how does the auction work': 'auction',
    'show me the ledger': 'ledger',
    'please help me': 'help_me',
    'come with me': 'together',
    'can i leave?': 'leave',
    "i'm bleeding": 'hurt',
    'are you going to kill me?': 'kill',
    'are you lying to me?': 'lying',
    'do you have any secrets?': 'secret',
    'any regrets?': 'regret',
    'are you happy?': 'happy',
    'have you ever been in love?': 'love',
    'do you believe in god?': 'god',
    'is there any hope?': 'hope',
    "what's your favorite thing?": 'favorite',
    'what do you hate?': 'hate',
    'what was your childhood like': 'childhood',
    'do you have friends?': 'friend',
    'want a drink?': 'drink',
    'what happens in the morning?': 'morning',
    'what about tonight': 'night',
    'promise me': 'promise',
    'goodbye': 'goodbye',
    "you're amazing": 'compliment',
    "what's the meaning of life?": 'meaning',
    'are you real?': 'real',
    'is this a game?': 'meta',
    'do you like cats?': 'animal',
    'have you seen the ocean?': 'ocean',
    'have you seen the stars?': 'stars',
    "i'm bored": 'bored',
  }
  for (const [text, topic] of Object.entries(cases)) it(`"${text}" → ${topic}`, () => expect(topicByKeyword(text)).toBe(topic))
  it('"catch"는 고양이가 아니다', () => expect(topicByKeyword('catch me if you can')).not.toBe('animal'))
  it('"start"는 별이 아니다', () => expect(topicByKeyword('where do we start')).not.toBe('stars'))
})

// 처음 온 사람이 제일 먼저 치는 말. 여기서 빗나가면 첫 자유 입력이 곧바로
// "못 알아들었다"는 인상이 되고, 이 게임의 유일한 훅이 거기서 죽는다.
describe('첫 질문 — 빗나가면 안 되는 것들', () => {
  const KO = {
    '너 뭔데?': 'self',
    '너 누구야?': 'self',
    '넌 뭐야': 'self',
    '당신 누구세요': 'self',
    '이게 뭐야': 'chip',
    '이 칩이 뭐야?': 'chip',
    '나 누구야': 'past',
    '무슨 일이야': 'plan',
  }
  for (const [text, topic] of Object.entries(KO))
    it(`"${text}" → ${topic}`, () => expect(topicByKeyword(text)).toBe(topic))

  it('대붕괴 질문을 가로채지 않는다', () => {
    expect(topicByKeyword('대붕괴 때 무슨 일이 있었어')).toBe('collapse')
    expect(topicByKeyword('what happened in the collapse?', 'en')).toBe('collapse')
  })
  it('영어 첫 질문도 잡힌다', () => {
    for (const q of ['who are you?', 'what are you', 'what is this chip', 'who am I'])
      expect(topicByKeyword(q, 'en'), q).toBeTruthy()
  })
})
