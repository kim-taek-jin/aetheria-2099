// ============================================================
//  answers.js — 플레이어가 묻는 것에 세계가 답한다(손으로 씀).
//
//  왜: 자유 입력을 선택지로 "분류만" 하면, 자유 입력은 결국 선택지를 다른
//  말로 고르는 것에 불과하다. 플레이어가 중심이 되려면 물어본 것에 답이
//  와야 한다 — "칩이 뭔데?"라고 치면 지금 눈앞의 인물이 자기 관점으로
//  대답해야 한다.
//
//  모델에게 답을 짓게 하면 품질이 무너지므로(7B는 한국어 산문을 못 쓴다),
//  답변도 사람이 쓴다. 모델은 "무엇을 묻는가"를 고르는 일만 한다.
//
//  같은 주제라도 화자마다 답이 다르다 — 그게 인물을 드러내는 방식이다.
//  렌은 값으로, 카엘은 규정으로, 에코는 불로, NEXUS는 보호로 답한다.
// ============================================================

// 주제 판별용 키워드(모델 없이도 동작하는 1차 신호).
export const TOPIC_KEYWORDS = {
  chip: ['칩', '#00', '이 물건', '데이터', '그거'],
  outside: ['바깥', '밖', '하늘', '초록', '숲', '정화', '장벽', '외부'],
  nexus: ['넥서스', 'nexus', '시스템', '인공지능', 'ai', '리엔'],
  self: ['당신', '너는', '넌 누구', '정체', '왜 그래', '왜 이런'],
  past: ['내 과거', '3년', '삼년', '내 기억', '나는 누구', '내가 누구', '지워진'],
  courier: ['배달원', '죽은 사람', '그 남자', '시체'],
  others: ['렌', '카엘', '에코', '다른 세력', '반군', '경비대'],
}

// ANSWERS[화자][주제] = { line, narration? }
export const ANSWERS = {
  Ren: {
    chip: {
      line: '값을 못 매기는 물건이야. 내 일에서 그건 두 가지 중 하나지 — 쓰레기거나, 아직 시장이 안 열린 거거나. 이건 후자야.',
    },
    outside: {
      narration: '렌이 스크린의 초록을 손가락으로 톡톡 두드린다. 값을 세는 손짓이다.',
      line: '저게 진짜면 저건 풍경이 아니라 땅이야, 제인. 등기가 없는 땅. 인류 역사상 그런 게 마지막으로 있었던 게 언제인지 알아?',
    },
    nexus: {
      line: 'NEXUS? 나한텐 세금 징수원이자 최대 고객이야. 감정은 없어. 거래 상대한테 감정 붙이면 손해 보거든.',
    },
    self: {
      line: '나? 값을 매기는 사람. 그게 다야. …더 알고 싶으면 그것도 값을 치러야 해.',
    },
    past: {
      narration: '렌이 잠시 제인을 본다. 값을 매기려다 실패한 사람의 눈이다.',
      line: '네 3년? 나도 찾아봤어. 없더라. 지워진 게 아니라 애초에 기록이 안 만들어진 것처럼. …그런 건 돈으로 못 사.',
    },
    courier: {
      line: '등록 안 된 배달원. 그런 애들은 보통 누가 지워준 거야. 지워주는 값이 꽤 비싸다는 것만 알아둬.',
    },
    others: {
      line: '카엘은 규정을 팔고, 에코는 신념을 팔지. 둘 다 자기가 안 판다고 믿는 게 웃긴 점이야.',
    },
  },

  Kael: {
    chip: {
      line: '증거물 #00. 규정상 압수 대상이다. …그리고 규정 밖의 말을 하자면, 그건 열쇠가 아니라 뇌관이다.',
    },
    outside: {
      narration: '카엘이 처음으로 시선을 피한다. 형광등이 그의 정수리에서 하얗게 부서진다.',
      line: '…봤다. 12년 전 순찰 기록에서. 그 기록은 다음 날 삭제됐고, 나는 삭제 명령서에 서명했다.',
    },
    nexus: {
      line: 'NEXUS는 이 도시의 심장이다. 심장을 열어보려는 자를 막는 게 내 일이고. …가끔은 그게 방부제인지 심장인지 모르겠다만.',
    },
    self: {
      line: '섹터 1 경비대 장교. 스물셋을 규정대로 처리했고, 한 명을 규정 밖에서 놓아줬다. 그게 나다.',
    },
    past: {
      line: '너의 3년? 조회했다. 기록이 삭제된 게 아니라 봉인돼 있더군. 그 권한을 가진 부서는 이 도시에 하나뿐이다.',
    },
    courier: {
      narration: '카엘이 홀로그램을 넘겨 사망자 기록을 띄운다. 항목이 비어 있다.',
      line: '신원 미상. …아니, 신원이 지워진 자다. 나는 그 절차를 안다. 내 손으로 세 번 해봤으니까.',
    },
    others: {
      line: '렌은 이익으로 움직이니 예측 가능하다. 에코는 신념으로 움직이니 예측 불가능하고. 위험한 쪽은 언제나 후자다.',
    },
  },

  Echo: {
    chip: {
      line: '그건 물건이 아니라 증거야. 20년짜리 거짓말의 물증. …그리고 우리 손에 있는 유일한 불씨고.',
    },
    outside: {
      narration: '에코의 눈이 스크린의 초록을 삼킬 듯이 본다.',
      line: '저기 봐. 저게 우리한테서 훔쳐간 거야. 하늘 하나를. 20년 동안 매일 아침을.',
    },
    nexus: {
      line: 'NEXUS는 간수야. 다정한 목소리로 자장가를 불러주는 간수. 그게 제일 나쁜 종류지.',
    },
    self: {
      narration: '에코가 손목의 흉터를 무의식적으로 문지른다.',
      line: '나? 열둘을 묻은 사람. 그리고 아직 안 멈춘 사람. 그거면 설명 되잖아.',
    },
    past: {
      line: '기억이 없다고? …그럼 넌 운이 좋은 거야. 나는 다 기억해. 이름도, 얼굴도, 마지막 표정도 전부.',
    },
    courier: {
      line: '우리 쪽 사람이었을 수도 있어. 이름 없이 움직이는 애들이 있거든. 죽어도 아무도 안 찾는.',
    },
    others: {
      line: '렌은 진실을 팔 거고 카엘은 묻을 거야. 파는 놈이랑 묻는 놈. 둘 다 결국 같은 편이지.',
    },
  },

  NEXUS: {
    chip: {
      line: '반출 금지 자산입니다, 시민 제인. …그것을 열면 당신이 사랑하는 모든 것이 시끄러워집니다.',
    },
    outside: {
      narration: '스피커 잡음이 한 박자 길어진다.',
      line: '바깥은… 회복되었습니다. 그리고 인간은 회복된 것을 다시 태웁니다. 두 번 보았습니다. 세 번은 보고 싶지 않습니다.',
    },
    nexus: {
      line: '나는 이 도시의 유지 체계입니다. …그리고 한때는, 이 도시를 사랑한 사람이었습니다.',
    },
    self: {
      line: '나는 잠들지 못하는 것입니다, 제인. 20년째.',
    },
    past: {
      narration: '자장가의 박자가 잠시 어긋난다.',
      line: '당신의 3년은 삭제가 아니라 요청이었습니다. 누가 요청했는지는… 스스로 기억해내야 합니다.',
    },
    courier: {
      line: '해당 개체는 등록되지 않았습니다. 등록되지 않은 것은 죽지도 않습니다, 시민 제인.',
    },
    others: {
      line: '그들은 셋 다 같은 것을 원합니다. 통제. 방식만 다를 뿐입니다. …나도 그중 하나이고요.',
    },
  },
}

// 화자가 답할 수 없을 때의 회피(주제 자체가 없을 때). 인물답게 비켜간다.
export const DEFLECT = {
  Ren: '그건 지금 값이 안 나와, 제인. 나중에 하자.',
  Kael: '지금은 그 질문에 답할 위치가 아니다.',
  Echo: '그건 나중에. 지금은 앞의 일만 생각해.',
  NEXUS: '해당 질의는 권한 밖입니다, 시민 제인.',
}

// 입력이 "행동"이 아니라 "묻는 것"에 가까운가.
const ASK_MARKS = /[?？]|뭐|무엇|무슨|왜|누구|어디|어떻게|어떤|맞아|인가|있나|건가|거야\s*$|니\s*$/
export function looksLikeQuestion(text) {
  return ASK_MARKS.test(String(text || ''))
}

// 키워드로 주제를 고른다(모델 없이 동작하는 1차 신호).
export function topicByKeyword(text) {
  const t = String(text || '').toLowerCase()
  let best = null
  let bestScore = 0
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
    const score = words.reduce((n, w) => n + (t.includes(w.toLowerCase()) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }
  return best
}

export const TOPICS = Object.keys(TOPIC_KEYWORDS)

// 답변 beat을 만든다. 씬은 진전시키지 않는다 — 대화는 장면을 소모하지 않는다.
// (그래서 플레이어가 마음껏 물어볼 수 있다. 다만 추적 시계는 계속 돈다.)
export function answerBeat(npc, topic, scene) {
  const byNpc = ANSWERS[npc] || ANSWERS.NEXUS
  const a = byNpc[topic]
  const line = a ? a.line : DEFLECT[npc] || DEFLECT.NEXUS
  return {
    // 대화 표식 — 상태머신이 호감 바닥 보장을 건너뛰게 한다.
    // 없으면 질문만 반복해도 호감이 매번 +6씩 올라 파밍이 된다.
    conversation: true,
    narration: (a && a.narration) || '',
    npc_name: npc,
    npc_response: line,
    npc_emotion: 'Neutral',
    suspicion_change: 0,
    affinity_change: 0,
    heat_change: 0,
    story_branch: null, // 호출자가 현재 노드로 채운다
    background_tone: scene?.tone || 'Normal',
    new_fragments: [],
    set_flags: [],
    evidence_result: 'none',
    generated_choices: [],
  }
}
