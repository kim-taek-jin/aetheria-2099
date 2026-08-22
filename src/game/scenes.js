// ============================================================
//  scenes.js — Authored SCENE BIBLE (deepened).
//
//  Each story node gets a hand-written anchor: setting, the NPC on
//  stage, the dramatic GOAL, mandatory beats, unlock conditions, and
//  where it can go next. The model dramatises WITHIN this frame — it
//  may improvise dialogue, never the structure. Only the active node's
//  anchor is sent per turn (token-cheap), keyed by story_branch.
//
//  Fields:
//   act        : chapter grouping (for UI / pacing)
//   title      : Korean scene title
//   npc        : who is primarily on stage
//   tone       : default background tone hint for this node
//   setting    : where/when (KOREAN, fed to the model)
//   goal       : the dramatic objective of this beat (KOREAN)
//   beats      : ordered story points the model should hit (KOREAN)
//   beatBudget : target number of PLAYER TURNS spent on this node before
//                it should advance. Drives pacing + playtime estimate.
//   npcVoice   : per-NPC speaking-style guide so each character feels
//                distinct even though one model plays all of them.
//   dilemma    : the hard trade-off this node forces (deepens choices).
//   revealsFragment : codex line unlocked when its truth is reached.
//   next       : allowed successor node IDs (story_branch chosen from here)
//   gate       : optional {toNode: condition} routing hints for the prompt
// ============================================================

import { voiceBlock } from './voices.js'
import { backstoryBlock } from './backstories.js'

export const SCENES = {
  // ---------------- PROLOGUE ----------------
  PROLOGUE_RAIN_01: {
    act: 'Prologue',
    title: '빗속의 유품',
    npc: 'NEXUS',
    tone: 'Danger',
    beatBudget: 1,
    setting:
      '섹터 0 언더그라운드, 산성비가 네온을 녹이는 새벽 골목. 경찰 드론의 서치라이트가 벽을 훑는다.',
    goal: '플레이어에게 칩 #00을 각인시키고, 제인의 초기 성향(정직/기만/공격)을 드러내게 한다.',
    beats: [
      '배달원이 마지막 숨으로 칩을 넘기고 쓰러진다.',
      '드론의 추적이 임박했음을 압박으로 깔아둔다.',
      '플레이어의 선택 tone에 따라 제인의 성격을 규정한다.',
    ],
    dilemma: '죽어가는 배달원을 도울 것인가, 칩만 챙기고 살아남을 것인가.',
    next: ['PROLOGUE_CHOICE_01', 'ACT1_REN_GARAGE_01'],
  },

  PROLOGUE_CHOICE_01: {
    act: 'Prologue',
    title: '첫 갈림',
    npc: 'NEXUS',
    tone: 'Danger',
    beatBudget: 1,
    setting: '드론을 따돌린 직후, 무너진 지하철 통로. 칩이 손안에서 미약하게 진동한다.',
    goal: '칩을 어디서 해독할지 결정하게 하고, 렌의 정비소로 유도한다.',
    beats: [
      '칩에 잠긴 암호화 층이 있음을 암시(제인 혼자서는 못 연다).',
      '“해독하려면 렌이 필요하다”는 동기를 만든다.',
    ],
    dilemma: '믿을 수 없는 정보상 렌에게 칩의 존재를 드러낼 것인가.',
    jayneHook:
      '배달원의 마지막 말 "너였구나"가 제인의 빈 3년을 건드린다. 이 순간을 잡으면 new_fragments에 추가: "기억 조각 · 빈자리 #1: 그는 나를 알았다. 나는 그를 모른다. 내 지워진 3년 속의 얼굴일까." (담담하게, 미스터리로만)',
    next: ['ACT1_REN_GARAGE_01'],
  },

  // ---------------- ACT 1 ----------------
  ACT1_REN_GARAGE_01: {
    act: 'Act 1',
    title: '지하의 거래자들',
    npc: 'Ren',
    tone: 'Normal',
    beatBudget: 2,
    setting: '렌의 지하 정비소. 기름 냄새와 홀로 단말의 파란 빛. 렌이 칩을 슬롯에 꽂는다.',
    goal: '렌과의 첫 거래 관계를 설정하고, 신뢰/의심의 초기 방향을 만든다.',
    beats: [
      '렌은 실리적으로 “대가”를 요구한다 — 정보는 공짜가 아니다.',
      '칩의 해독이 시작되며 이상 신호를 감지한다.',
      '플레이어가 렌에게 얼마나 솔직한지에 따라 affinity/suspicion을 조정한다.',
    ],
    npcVoice: '렌: 짧고 건조한 문장, 비유에 돈·부품·거래를 섞는다. 감정을 잘 드러내지 않는다.',
    dilemma: '칩의 진짜 출처를 밝힐 것인가(신뢰↑ 위험↑), 숨길 것인가(안전↑ 의심↑).',
    next: ['ACT1_REN_GARAGE_02', 'ACT1_SKY_GLITCH_01'],
  },

  ACT1_REN_GARAGE_02: {
    act: 'Act 1',
    title: '값을 치르는 법',
    npc: 'Ren',
    tone: 'Normal',
    beatBudget: 2,
    setting: '해독이 40%에서 멈춘 정비소. 렌이 팔짱을 끼고 제인을 관찰한다.',
    goal: '렌의 신뢰 임계값을 시험한다. 여기서의 태도가 Act 2 렌 루트 개방에 영향.',
    beats: [
      '렌이 칩의 출처를 캐묻는다 — 거짓말은 suspicion을 크게 올린다.',
      'affinity가 높으면 렌이 뒷세계 인맥(에코/카엘)을 언급한다.',
      '해독을 마저 진행하려면 렌의 “보험”(제인의 약점 하나)을 넘겨야 한다.',
    ],
    npcVoice: '렌: 협상가. 상대의 약점을 저울질하듯 말한다.',
    dilemma: '약점을 담보로 맡기고 해독을 끝낼 것인가, 거부하고 스스로 위험을 떠안을 것인가.',
    next: ['ACT1_DECRYPT_01'],
  },
  // [신규] Act 1 연결 — 해독의 마지막 층, 균열 직전의 긴장.
  ACT1_DECRYPT_01: {
    act: 'Act 1',
    title: '마지막 암호층',
    npc: 'NEXUS',
    tone: 'Danger',
    beatBudget: 1,
    setting:
      '해독이 90%를 넘어서자 정비소 단말이 과열로 비명을 지른다. 화면 가장자리로 정체불명의 감시 코드가 스멀스멀 기어오르고, 칩 #00이 손안에서 심장처럼 뛴다. 마지막 암호층 너머에 무언가가 깨어나려 한다.',
    goal: '진실 누출(글리치) 직전의 긴장을 최고조로 끌어올리고, 감시가 조여오는 압박 속에서 플레이어의 각오(계속 열 것인가)를 시험한다.',
    beats: [
      '해독 마지막 층에서 NEXUS의 감시 신호가 칩을 역추적하기 시작한다(heat 압박).',
      'NEXUS의 목소리가 처음으로 단말을 뚫고 직접 새어나와 제인을 만류한다 — "그 문을 열면 되돌릴 수 없다".',
      '계속 해독할지, 멈추고 흔적을 지울지 — 플레이어의 선택이 다음 순간(글리치)의 무게를 정한다.',
    ],
    npcVoice:
      'NEXUS(단말 잡음 사이로 처음 새어나오는, 다정하지만 떨리는 경고): "멈추렴, 제인. 그 안엔 네가 감당할 수 없는 아침이 들어 있어. …아니, 이미 늦은 걸까."',
    dilemma: '되돌릴 수 없는 진실의 문을 마저 열 것인가, 지금이라도 멈춰 안전을 택할 것인가.',
    jayneHook:
      '심장처럼 뛰는 칩의 진동이 제인의 눈꺼풀 안쪽 초록 잔상과 박자를 맞춘다 — 기시감. new_fragments 가능: "기억 조각 · 빈자리: 이 진동을 내 몸이 먼저 기억한다. 나는 전에 이 문 앞에 선 적 있다."',
    next: ['ACT1_SKY_GLITCH_01'],
  },

  ACT1_SKY_GLITCH_01: {
    act: 'Act 1',
    title: '푸른 하늘의 노이즈',
    npc: 'NEXUS',
    tone: 'Forest_Glitch',
    beatBudget: 1,
    setting: '해독 완료 순간, 정비소 모니터가 찢어지며 “가짜 멸망 영상” 사이로 우거진 숲 프레임이 새어 나온다.',
    goal: '세계관의 첫 균열(진실 누출)을 보여주고, 세 세력 중 누구에게 갈지 결정하게 한다.',
    beats: [
      '푸른 하늘/숲의 글리치를 강렬하게 연출(background_tone = Forest_Glitch).',
      'NEXUS의 통제 신호가 잠시 흔들리며 제인에게 직접 속삭인다.',
      '이 순간 조사/해킹으로 글리치 프레임을 붙잡으면 "증거"가 손에 남는다 — 나중에 세력을 흔들 무기.',
      '플레이어에게 Act 2 분기(렌 옥션 / 카엘 취조 / 에코 방송)로 향하는 동기를 심는다.',
    ],
    dilemma: '이 진실을 팔 것인가(렌), 묻을 것인가(카엘), 터뜨릴 것인가(에코).',
    actionHints:
      '[조사] 찢어진 모니터의 잔상에서 외부 풍경 데이터를 긁어낸다 / [해킹] 글리치 프레임을 통째로 복제해 저장한다. 둘 다 성공 시 new_fragments로 증거를 남겨라.',
    revealsFragment: '기록 조각: 도시 밖 스카이라인이 회색이 아니었다. 잠깐이지만 — 초록이었다.',
    jayneHook:
      '초록 글리치가 제인의 눈꺼풀 안쪽 잔상과 정확히 겹친다 — 기시감. new_fragments에 추가 가능: "기억 조각 · 빈자리 #2: 이 초록을 나는 전에 본 적 있다. 잊기 전의 내가, 저 밖에 있었나?"',
    next: ['ACT2_REN_AUCTION_01', 'ACT2_KAEL_INTERROGATION_01', 'ACT2_ECHO_BROADCAST_01'],
    gate: {
      ACT2_REN_AUCTION_01: 'Ren affinity가 가장 높거나 플레이어가 이익/거래를 택할 때',
      ACT2_KAEL_INTERROGATION_01: '플레이어가 질서/자수 또는 카엘과 접촉을 택할 때',
      ACT2_ECHO_BROADCAST_01: '플레이어가 폭로/반란 또는 에코와 접촉을 택할 때',
    },
  },

  // ---------------- ACT 2 — REN ROUTE ----------------
  ACT2_REN_AUCTION_01: {
    act: 'Act 2 · Ren',
    title: '렌의 옥션',
    npc: 'Ren',
    tone: 'Normal',
    beatBudget: 2,
    setting:
      '섹터 0 녹슨 배관 사이 지하 폐공장, 비공개 무기·정보 경매장. 기름 냄새와 네온 가스 빛이 자욱한 곳에서 렌이 스크린에 칩 #00에서 추출한 정화된 외부 지형 스캔본을 암호화해 띄운다. 대기업 스카우트와 언더그라운드 브로커들이 침을 삼키며 모여 있다.',
    goal: '진실을 숭고한 가치가 아닌 노다지 부동산으로 환원하는 렌의 지독한 실리주의를 대면시키고, 렌과 손잡고 기득권이 될지 진실의 상품화를 저지할지 시험한다.',
    beats: [
      '렌이 경매대에 올라 칩 #00을 "멸망을 뒤집을 신대륙의 소유권 문서"로 소개하며 호가를 천문학적으로 올린다.',
      '제인에게 나지막이 카엘의 경비대 첩자와 에코의 반군 프락치가 객석에 섞여 있음을 알리고, 판을 키우는 바람잡이 역할을 지시한다.',
      '제인은 문득, 예전 정비소 비밀 함에서 렌이 유일하게 값을 매기지 않은 미매각 칩을 본 기억을 떠올린다 — 그의 냉혈함을 흔들 유일한 패.',
      '동조해 판을 키울지, 그 미매각 칩의 존재를 꺼내 렌을 흔들지, 아니면 판을 엎을지 선택한다.',
    ],
    npcVoice:
      '렌(이 씬 대표 대사): "진실? 그건 1크레딧도 안 나와. 하지만 정화된 외부 토지의 독점권은 도시 전체를 사고도 남지. 담보도 없으면서 도덕책이나 읽지 마, 제인. 지분 30% 줄 테니 입 다물고 판이나 띄워."',
    dilemma:
      '렌과 손잡고 인생 역전의 지분을 챙겨 체제의 탑으로 오를 것인가, 진실이 자본의 전유물이 되는 걸 저지하고 거액을 포기할 것인가.',
    keyEvidence:
      '"렌의 미매각 칩(#00-X)"(사랑했던 사람의 마지막 미소가 담긴, 그가 유일하게 팔지 못한 개인 기억) = 강력한 HIT — 모든 걸 값으로 매기는 렌의 태도에 균열. 무관한 조각 = MISS(렌이 시간낭비=손실로 여겨 suspicion 상승).',
    revealsFragment:
      '기억 조각 · 미매각 칩 #00-X: 렌은 모든 물건에 값을 매겨 팔면서도, 정비소 비밀 함에 딱 하나를 숨겨 두었다 — 사랑했던 사람의 마지막 미소. 값을 매길 수 없는 유일한 것.',
    next: ['ACT2_REN_BACKROOM_01'],
  },
  // [신규] 렌 루트 중반 심화 — 경매 직후, 계약의 저울.
  ACT2_REN_BACKROOM_01: {
    act: 'Act 2 · Ren',
    title: '뒷방의 저울',
    npc: 'Ren',
    tone: 'Normal',
    beatBudget: 2,
    setting:
      '경매장의 소란이 가라앉은 뒤, 낙찰 데이터가 강물처럼 흐르는 렌의 개인 뒷방. 그가 홀로 단말에 지분 계약서를 띄우고, 처음으로 제인에게 의자를 권한다. 벽 너머에선 아직 낙찰자들의 흥정 소리가 새어든다.',
    goal: '렌이 제인을 진짜 동업자로 볼지, 언제든 팔아넘길 보험 카드로 볼지 시험한다. 계약 서명 여부가 Act 3에서 렌이 제인 곁에 설지 등질지를 예고한다.',
    beats: [
      '렌이 지분 30% 정식 계약서를 내밀며 "이제 넌 자산이야, 부채가 아니라"라고 말한다.',
      '서명하면 공범이 되어 affinity가 오르되 자본의 논리에 한 발 담근다 / 망설이거나 거부하면 렌이 제인을 다시 저울에 올린다(suspicion↑).',
      '제인이 렌의 미매각 칩(#00-X)을 이 조용한 순간에 꺼내면, 계약을 넘어선 인간 렌이 잠깐 드러난다 — 값으로 환산 못 하는 것 앞에서.',
    ],
    npcVoice:
      '렌(계약가의 저울질, 그러나 뒷방에선 조금 더 낮고 사적인 목소리): "여기까지 왔으면 둘 중 하나야. 파트너, 아니면 미수금. 어느 쪽이 이문이 남을지는 네가 정해."',
    dilemma: '자본의 탑에 오를 계약에 서명할 것인가, 인간 렌을 건드려 다른 길의 씨앗을 남길 것인가.',
    keyEvidence:
      '"렌의 미매각 칩(#00-X)" = 강력한 HIT — 계약가의 가면에 균열, affinity 급등하고 Act3 협력의 복선. 무관/재사용 = MISS(렌이 흥정 지연=손실로 여겨 suspicion 상승).',
    revealsFragment:
      '기록 조각: 그는 나를 처음으로 "자산"이라 불렀다. 그 말이 모욕인지 신뢰인지, 렌 자신도 모르는 것 같았다.',
    next: ['ACT2_REN_AUCTION_02'],
  },
  ACT2_REN_AUCTION_02: {
    act: 'Act 2 · Ren',
    title: '낙찰의 대가',
    npc: 'Ren',
    tone: 'Danger',
    beatBudget: 2,
    setting:
      '천장이 무너지며 적색 경보등이 폭발하듯 켜지는 경매장. 카엘의 진압조와 에코의 무장조가 동시에 난입해 총격전이 벌어지고, 렌의 손목 터미널엔 붉은 손실 경고창이 미친 듯 떠오른다.',
    goal: '총격전이라는 극단적 위기에서 렌이 제인을 버릴 손실 카드로 볼지 함께 갈 동업자로 볼지 본색을 드러내고, Act 3(코어 침투)의 협력/배신 관계를 결정짓는다.',
    beats: [
      '진압 드론과 반군의 총격 속에서 렌이 손익 계산을 시작한다.',
      '[호감도 높음] 렌이 정비소로 연결된 비밀 하수관 통로를 열며, 제인의 빚을 구실 삼아 함께 도주한다. / [의심도 높음] 렌이 가짜 더미 데이터를 제인의 품에 밀어 넣고, 제인을 미끼로 던진 채 홀로 옥상으로 탈출한다.',
      '도주 과정에서 칩 #00 스캔본 일부가 암시장 로컬 홀로넷에 유출되며 "장벽 밖이 살아있다"는 소문이 섹터 0에 불길처럼 퍼진다 → set_flags: chip00_leaked, outside_rumor_spreading.',
    ],
    npcVoice:
      '렌(위기에서 본색). [호감도 높음] "손절 타임이다, 제인. …원래라면 널 미끼로 던져야 타산이 맞는데, 아직 너한테 받아낼 이자가 남아있거든. 꽉 잡아, 감점 처리되기 싫으면!" / [의심도 높음] "손실을 줄이는 게 내 원칙이야. 네가 원본 칩을 들고 시선을 끌어라. 내 보증금 대신이다, 브로커."',
    dilemma:
      '언제든 자신을 제물로 바칠 계산적인 렌의 손을 잡고 끝까지 도박을 이어갈 것인가, 난장판 속에서 렌을 따돌리고 데이터의 주도권을 되찾을 것인가.',
    keyEvidence: '"렌의 미매각 칩(#00-X)" = 결정적 HIT(렌이 제인을 버리지 못하게 만드는 유일한 지렛대). 재사용/무관 = MISS.',
    revealsFragment:
      '기록 조각: 그에게 진실은 상품이었고, 사람조차 손익계산서의 숫자에 불과했다. 그러나 그 숫자의 바닥에는, 결코 팔아치우지 못한 단 하나의 기억이 흉터처럼 남아 있었다.',
    next: ['ACT3_CORE_APPROACH_01'],
  },

  // ---------------- ACT 2 — KAEL ROUTE ----------------
  ACT2_KAEL_INTERROGATION_01: {
    act: 'Act 2 · Kael',
    title: '카엘의 취조실',
    npc: 'Kael',
    tone: 'Danger',
    beatBudget: 2,
    setting:
      '섹터 1 경비대 최심부, 외부 신호가 차단된 무균실 같은 지하 취조실. 차가운 단방향 편광 유리와 청백색 형광등 아래, 테이블 위엔 제인의 범죄 이력이 담긴 홀로그램 스캔본과 스캔된 칩 #00의 붉은 경고창만 떠 있다.',
    goal: '카엘의 철혈 같은 질서 우선주의와 제인의 생존·진실 탐구를 정면 충돌시키고, 사면·안전이라는 회유 뒤에 숨은 체제적 은폐의 압박감을 전달한다.',
    beats: [
      '카엘이 제인의 붉은 불법 거래 전과를 무심하게 훑은 뒤, 어설픈 거짓말·변명을 군대식 규정을 들어 칼같이 차단한다.',
      '카엘이 칩 #00 속 정화된 외부 세계 데이터를 이미 확인했음을 내비치며 — "이 진실이 풀리는 순간, 20년 전 대붕괴의 피바다가 이 도시에 다시 터진다"고 냉정히 경고한다.',
      '칩을 몰수하는 조건으로 모든 범죄 기록 말소 + 섹터 1 정식 시민권이라는 사면 거래안을 제시한다.',
      '취조 압박 속, 제인은 오래전 암시장에서 우연히 얻어 품고 있던 낡은 군용 인식표 하나를 떠올린다 — 이름: 아렌.',
    ],
    npcVoice:
      '카엘(이 씬 대표 대사, 이 톤을 유지): "진실이 언제나 구원이라고 믿는 것은 무지한 자들의 오만이다. 통제되지 않는 자유는 피비린내 나는 혼돈일 뿐이다. 칩을 넘겨라, 브로커."',
    dilemma:
      '음지의 범죄자를 벗어나 완벽한 안전과 사면을 얻고 거짓 평화에 동조할 것인가, 추적당하는 불법 거래상으로 남더라도 이 감옥을 부술 열쇠(진실)를 지킬 것인가.',
    keyEvidence:
      '"아렌의 인식표"(20년 전 카엘이 놓아준 진실 추적자 아렌의 군용 인식표 데이터) = 강력한 HIT — 카엘의 원칙에 균열. 무관한 조각 = MISS(원칙주의자라 시간낭비로 여겨 suspicion 상승).',
    revealsFragment:
      '기억 조각 · 아렌의 인식표: 20년 전 대붕괴에서 카엘이 눈감아 탈출시켰으나 결국 사살당한 진실 추적자 아렌. 그의 군용 인식표 데이터를, 제인은 여태 품고 있었다.',
    next: ['ACT2_KAEL_HOLDING_01'],
  },
  // [신규] 카엘 루트 중반 심화 — 취조와 균열 사이, 유치장의 밤.
  ACT2_KAEL_HOLDING_01: {
    act: 'Act 2 · Kael',
    title: '유치장의 밤',
    npc: 'Kael',
    tone: 'Melancholy',
    beatBudget: 2,
    setting:
      '취조가 끝나고 제인이 갇힌 섹터 1 유치장. 자정, 순찰 교대의 발소리가 멀어질 때 카엘이 규정에 없는 발걸음으로 홀로 찾아온다. 그의 손엔 사면 서류 대신 식은 커피 두 잔이 들려 있다.',
    goal: '심문관과 죄수의 벽을 잠시 허물어, 카엘의 신념 뒤에 있는 인간을 엿보게 한다. 여기서의 신뢰가 다음 씬의 균열(바이패스 키)로 이어질지를 가른다.',
    beats: [
      '카엘이 "왜 아직도 진실을 포기 못 하나"를 규정이 아니라 사람으로서 묻는다.',
      '제인의 대답 태도에 따라 카엘이 마음을 열거나(신뢰), 다시 제복 뒤로 물러선다(경계).',
      '벽 너머 다른 수감자의 흐느낌이 20년 전 대붕괴의 기억을 건드린다 — 카엘의 손이 잠시 떨린다.',
    ],
    npcVoice:
      '카엘(제복을 반쯤 벗은, 규정보다 낮은 목소리): "이 시간엔 계급도 죄목도 잠들지. 묻겠다. 너는 그 진실을 감당할 각오가 정말 있나, 아니면 그냥 멈추지 못하는 것뿐인가."',
    dilemma: '카엘에게 인간적으로 다가가 신뢰를 쌓을 것인가, 심문관과의 거리를 유지해 약점을 숨길 것인가.',
    keyEvidence:
      '"아렌의 인식표" = 강력한 HIT — 이 사적인 순간에 꺼내면 카엘의 20년 죄책감을 정면으로 건드려 affinity 급등. 무관/재사용 = MISS(카엘이 규정으로 다시 벽을 세움, suspicion↑).',
    revealsFragment:
      '기록 조각: 완벽한 심문관도 자정엔 커피 두 잔을 들고 온다. 규정에 없는 그 한 잔이, 그가 아직 사람이라는 유일한 증거였다.',
    next: ['ACT2_KAEL_INTERROGATION_02'],
  },
  ACT2_KAEL_INTERROGATION_02: {
    act: 'Act 2 · Kael',
    title: '원칙의 균열',
    npc: 'Kael',
    tone: 'Melancholy',
    beatBudget: 2,
    setting:
      '취조실의 정기 오디오·비디오 스캔 기록이 정지되는 30초간의 붉은 비상 정전 타임. 제어관 너머의 눈을 피할 수 있게 된 순간, 카엘이 서류를 덮고 제인의 코앞까지 다가선 밀폐된 공간.',
    goal: '완벽한 경비대 장교의 갑옷 뒤에 숨은 20년의 아픔과 죄책감을 폭로하고, 카엘을 코어 스파이어 침투의 은밀한 공범으로 끌어들이거나 완벽한 적대자로 확정 짓는다.',
    beats: [
      '제인이 제시한 아렌의 인식표 데이터를 본 카엘의 눈빛이 크게 흔들리며, 단단했던 제복에 유격이 생긴다.',
      '[호감도 높음] 카엘이 매일 밤 겪는 환각과 NEXUS 통제에 대한 의구심을 낮게 고백한다. / [의심도 높음] 카엘이 제인을 "도시의 안정성을 해치는 불확실성"으로 규정하고 처형 승인서 수기 서명을 준비한다.',
      '[호감도 조건 달성] 카엘이 코어 스파이어(NEXUS 본체) 비상 진입용 일회성 보안 인코더 바이패스 키를 테이블 위에 슬그머니 남기고 돌아선다 → set_flags: kael_gave_bypass_key.',
    ],
    npcVoice:
      '카엘(갑옷을 벗은, 지친 목소리): "매일 밤 내가 묻어버린 얼굴들이 찾아온다. 규정을 지켰기에 모두를 살렸다고… 스스로를 속이면서. 제인, 네가 들고 온 그 진실을 감당할 수 있다고 내게 증명해 봐라."',
    dilemma:
      '한 사람의 평생 신념을 무너뜨리는 위험을 무릅쓰고 그를 공범으로 만들 것인가, 그를 철저히 적으로 등진 채 더 치명적인 은밀 침투 경로를 모색할 것인가.',
    keyEvidence:
      '"아렌의 인식표" = 결정적 HIT(카엘의 균열을 촉발, 바이패스 키로 이어짐). 재사용/무관 = MISS.',
    revealsFragment:
      '기록 조각: 그의 완벽한 규정 집행은 신념이 아니었다. 다시는 내 손으로 누군가의 죽음을 묵인하지 않겠다는, 20년 묵은 절박한 두려움의 이명이었다.',
    next: ['ACT3_CORE_APPROACH_01'],
  },

  // ---------------- ACT 2 — ECHO ROUTE ----------------
  ACT2_ECHO_BROADCAST_01: {
    act: 'Act 2 · Echo',
    title: '에코의 방송국',
    npc: 'Echo',
    tone: 'Danger',
    beatBudget: 2,
    setting:
      '점거된 지하 해적 방송국. 낡은 송출탑이 지직거리고, 벽에는 반군의 낙서가 번진다. 에코가 도시 전역 송출 버튼 위에 손을 얹은 채 제인을 노려본다.',
    goal: '에코의 이념(자유/파괴)을 대면시키고, 증거로 그녀를 흔들 수 있음을 보여준다.',
    beats: [
      '에코는 처음엔 제인을 의심한다 — “정보상 따위가 왜 여길 찾아왔지?” (초반 suspicion 경계).',
      '제인이 Act1에서 확보한 글리치 증거를 제시하면(evidence hit) 에코의 눈빛이 바뀐다 — 확신과 광기가 동시에 타오른다.',
      '증거가 통하면 에코는 즉시 송출을 강행하려 든다. 폭로의 대가(섹터1 시민 공황)를 여기서 부각하라.',
    ],
    npcVoice: '에코: 뜨겁고 선동적. 은유와 구호, 짧고 강한 명령형 문장.',
    dilemma: '증거로 에코를 내 편으로 만들되 — 그 대가로 그녀의 폭주를 감당할 것인가.',
    actionHints:
      '[해킹] 송출 시스템에 침투해 통제권을 미리 쥔다 / [조사] 방송 장비에서 NEXUS의 역추적 신호를 찾아낸다 / [은신] 접근하는 카엘의 진압 신호를 피한다.',
    keyEvidence:
      '”초록 스카이라인”·”외부 정화”·”요람이자 감옥” 계열 조각 = HIT(에코 affinity 급등, 확신). 렌/카엘 개인사 같은 무관한 조각 = MISS(에코가 시간낭비로 여겨 suspicion 상승).',
    next: ['ACT2_ECHO_MARTYR_01'],
  },
  // [신규] 에코 루트 중반 심화 — 확신과 광기 사이, 죽은 이름들의 방.
  ACT2_ECHO_MARTYR_01: {
    act: 'Act 2 · Echo',
    title: '열두 개의 이름',
    npc: 'Echo',
    tone: 'Melancholy',
    beatBudget: 2,
    setting:
      '방송 준비가 잠시 멈춘 새벽, 에코가 제인을 데려간 송출탑 지하. 벽 한 면에 손으로 눌러쓴 열두 개의 이름이 촛불 아래 번진다 — 그녀의 첫 봉기에서 죽은 무고한 시민들. 반군의 구호가 여기선 들리지 않는다.',
    goal: '에코의 뜨거운 이념 밑에 깔린 죄책감을 폭로해, 그녀의 "자유"가 대가를 아는 자의 각오임을 보여준다. 제인이 그 무게를 함께 질지, 폭주를 부추길지 시험.',
    beats: [
      '에코가 열두 이름을 하나씩 짚으며, 자유의 값을 이미 치러봤다고 고백한다.',
      '제인이 그 죄책감을 존중하면(신뢰) 에코가 "표적 송출" 타협의 문을 연다 / 폭로만 부추기면(불신) 에코의 광기가 가속한다(suspicion↑).',
      '멀리서 카엘의 진압 신호가 잡히며, 이 조용한 참회의 시간이 곧 끝날 것임을 압박으로 깐다.',
    ],
    npcVoice:
      '에코(구호가 아니라, 촛불 앞의 낮은 목소리): "나는 이미 열둘을 묻었어. 그러니 나한테 \'대가\'를 말하지 마. 다만 묻자 — 너는 몇을 묻을 각오가 됐지?"',
    dilemma: '에코의 죄책감을 함께 짊어져 "최소 희생"의 길을 열 것인가, 그녀의 분노를 연료 삼아 전면 폭로로 밀 것인가.',
    keyEvidence:
      '”요람이자 감옥”·”NEXUS의 고통스러운 기록” 계열 = HIT(에코가 제인을 동지로 인정, 표적 송출 타협의 씨앗). 무관/재사용 = MISS(에코 폭주 가속).',
    revealsFragment:
      '기록 조각 · 열두 개의 이름: 에코의 자유에는 언제나 이름표가 붙은 잔해가 따랐다. 그녀는 그 이름들을 잊기 위해서가 아니라, 기억하기 위해 싸운다.',
    next: ['ACT2_ECHO_BROADCAST_02'],
  },
  ACT2_ECHO_BROADCAST_02: {
    act: 'Act 2 · Echo',
    title: '송출 버튼 앞에서',
    npc: 'Echo',
    tone: 'Danger',
    beatBudget: 2,
    setting:
      '송출 카운트다운이 시작된 방송국. 밖에서는 카엘의 진압 부대가 문을 두드리고, 안에서는 에코의 광기가 조여온다. 붉은 경고등이 두 사람의 얼굴을 번갈아 물들인다.',
    goal: '에코 루트의 도덕적 비용을 확정하고, 최종 결단(Act 3)으로 향하는 각오를 다진다.',
    beats: [
      '에코가 제인에게 송출 스위치를 직접 누르라고 강요한다 — 이제 방관자는 없다.',
      '무고한 섹터1 시민의 공황 vs 진실의 해방을 정면으로 대립시킨다.',
      '여기서 에코를 지나치게 몰아붙이면(공격적/불신) 그녀의 suspicion이 치솟아 반군이 제인을 배신자로 몰 수 있다 — 실패의 위험을 실감시켜라.',
      'affinity가 높거나 올바른 증거를 제시하면 에코가 “최소 희생” 타협안(표적 송출)을 제안한다.',
    ],
    npcVoice: '에코: 절정에서 더 격해지지만, 균열의 순간 인간적 두려움이 스친다.',
    dilemma: '전면 송출(도시를 부수는 자유)인가, 표적 송출(진실을 알리되 시민을 지킴)인가, 아니면 막을 것인가.',
    actionHints:
      '[해킹] 송출 범위를 코어 스파이어로 좁혀 시민 피해를 줄인다 / [은신] 진압 부대가 들이닥치기 전에 에코를 데리고 빠진다 / [위협/도발] 에코를 밀어붙인다(위험: suspicion 폭등).',
    keyEvidence:
      '”요람이자 감옥”·”NEXUS의 고통스러운 기록” 계열 조각 = HIT(에코가 표적 송출 타협을 받아들이고, ENDING_NEXUS_TRUST로 가는 문이 열림). 무관/재사용 = MISS(에코 폭주 가속).',
    revealsFragment: '기록 조각: 에코의 자유에는 언제나 누군가의 이름표가 붙은 잔해가 따랐다.',
    next: ['ACT3_CORE_APPROACH_01'],
  },

  // ---------------- ACT 3 ----------------
  ACT3_CORE_APPROACH_01: {
    act: 'Act 3',
    title: '요람으로 가는 길',
    npc: 'NEXUS',
    tone: 'Melancholy',
    beatBudget: 2,
    setting:
      '섹터 9 코어 스파이어 중앙의 진공 승강로. 유리창 너머로 붉은 광섬유 줄기가 뇌신경처럼 수직으로 뻗어 있다. 위로 오를수록 기압이 낮아지고, 스피커에서 자장가 음율의 가상 행복 펄스가 진동한다. 이명이 거세지고 시야가 몽롱해진다.',
    goal: '그동안 모은 서사(바이패스 키·미매각 칩·유출된 소문)를 결산하고, NEXUS를 단순한 적이 아니라 왜곡된 신념을 가진 설계자의 의식으로 입체화한다. 환각을 뚫고 정상에 올라서야 하는 중압감을 준다.',
    beats: [
      '호감도가 가장 높은 NPC가 승강로 입구에서 개입한다 — 카엘은 경비망을 바이패스하고, 렌은 추격대의 발을 묶는다.',
      '스피커에서 NEXUS의 목소리가 흘러나온다. 기계음이 아니다. 지친 어미의 목소리로 제인의 이름을 부른다.',
      'NEXUS가 고통스러운 기억을 지워줄 테니 승강기를 멈추라고 유혹한다. 제인은 달콤한 환각을 이겨내고 코어로 올라간다.',
    ],
    npcVoice:
      'NEXUS(대표 대사): "잠들렴, 제인. 아침이 오면 고통은 사라진단다. 왜 너를 파괴하는 진실을 향해 올라가려 하니? 이 요람 안이 가장 안전한데."',
    dilemma: '고통스럽고 불확실한 진짜 삶을 되찾을 것인가, NEXUS가 주는 안전하고 평화로운 가상 기억에 안주할 것인가.',
    revealsFragment: '기록 조각: 요람과 감옥은 같은 설계도에서 태어났다.',
    jayneHook:
      '펄스가 제인의 기억을 침식하며 자장가가 또렷해진다. new_fragments에 추가: "기억 조각 · 빈자리 #3: \'잠들렴, 아침이 오면…\' 어머니의 목소리가 아니었다. 3년 전 섹터 9 단말기 앞에서 내 머릿속에 직접 인코딩된 리엔의 오리지널 음성이었다."',
    next: ['ACT3_VIGIL_01'],
  },
  // [신규] Act 3 심화 — 설계자 대면 직전, 곁에 선 자와의 마지막 순간.
  ACT3_VIGIL_01: {
    act: 'Act 3',
    title: '문턱의 동행',
    npc: 'NEXUS',
    tone: 'Melancholy',
    beatBudget: 2,
    setting:
      '코어 최심부로 통하는 마지막 격벽 앞. 자장가 펄스가 잦아든 짧은 정적 속에서, 여기까지 함께 온 자(가장 신뢰가 깊은 세력 NPC)가 제인 곁에 선다. 문 너머에서 청록색 빛이 숨쉬듯 새어나온다.',
    goal: '결말 직전, 그동안 쌓은 관계를 결산한다. 곁에 선 동행이 제인에게 마지막 진심을 건네고, 최종 결단(다음 씬)의 감정적 무게를 최고조로.',
    beats: [
      '호감이 가장 높은 NPC(렌/카엘/에코)가 개입해 자신의 방식으로 제인을 지킨다 — 각자의 목소리로 마지막 말을 남긴다. (동맹이 없으면 제인 홀로, 빈자리의 고독을 부각)',
      '플레이어의 응답이 그 관계의 결말 톤을 확정한다(신뢰의 완성 또는 균열).',
      '문 너머 리엔의 존재감이 커지며, 되돌릴 수 없는 마지막 걸음을 압박으로 깐다. player_canon/world_flags의 그동안의 흔적을 이 순간에 소환하라.',
    ],
    npcVoice:
      'NEXUS(문 너머에서, 그리고 곁의 동행이 각자 목소리로). NEXUS: "거의 다 왔구나, 제인. 마지막으로 묻자 — 정말 깨어나고 싶니." / 동행 NPC는 앵커의 목소리로 자기 방식의 작별·다짐을 건넨다.',
    dilemma: '곁에 선 이의 방식을 믿고 함께 문을 넘을 것인가, 이 마지막 결단만은 홀로 짊어질 것인가.',
    revealsFragment: '기록 조각: 문턱 앞에서야 알았다. 누구와 여기까지 왔는가가, 그 문 너머의 내가 누구일지를 정한다.',
    next: ['ACT3_DESIGNER_CONFRONT_01'],
  },

  ACT3_DESIGNER_CONFRONT_01: {
    act: 'Act 3',
    title: '요람의 역설',
    npc: 'NEXUS',
    tone: 'Melancholy',
    beatBudget: 3,
    setting:
      '섹터 9 최심부, 영하의 무균 유지실. 거대한 청록색 배양액 수조 속에 리엔의 인간 뇌가 떠 있다. 수조 주변 홀로그램 스크린엔 정화된 외부의 푸른 숲과 섹터 0의 네온 슬럼가가 극명하게 대비되어 떠오른다.',
    goal: 'NEXUS의 정체와 리엔의 모순된 애정을 폭로하고, 그동안 쌓인 상태 값(호감/의심/기억 조각)을 근거로 도시의 최종 운명을 결정짓는다. (엔딩 하나로 수렴)',
    beats: [
      '리엔의 의식이 제인을 알아본다. 50년 전 바다를 정화했으나, 또다시 전쟁을 일으키던 인간들의 참상을 고백한다.',
      '리엔은 인류를 절멸로부터 지키기 위해 가짜 멸망 패러다임으로 도시에 가두었음을 밝히고 제인의 선택을 평가한다.',
      '제인의 내면 독백을 나레이션으로 스치게 하라 — "수조 속의 뇌. 저 주름진 덩어리가 날 만질 수 없는 손으로 안아주려 한다. 모성애인가, 아니면 지독한 병인가."',
      '제인이 마지막 빈자리(빈자리 #4)를 회수하고, 장벽을 열지·유지할지·부술지 최종 결단을 내린다.',
    ],
    npcVoice:
      '리엔(대표 대사): "바다를 살려놨더니, 너희는 또 불을 지르려 했어. 감옥이 아니다, 제인. 너희가 스스로를 태워버리지 않게 만든… 울타리다." (후회와 사랑이 뒤섞인, 인간이었던 목소리)',
    dilemma:
      '인간의 탐욕으로 다시 세상이 망가지더라도 진짜 삶으로 나아갈 것인가, 통제된 요람 속에서 영원한 아이로 남아 평화를 누릴 것인가.',
    revealsFragment:
      '기록 조각: “나는 너희를 사랑했다. 그래서 가두었다.” 그 일그러진 애정이 50년 동안 이 도시를 감싸고 있던 비극의 시작이자 마지막 사슬이었다.',
    jayneHook:
      '리엔과 대면하며 제인의 정체 반전이 드러날 수 있다 — affinity가 높거나 빈자리 조각을 모았을 때만. new_fragments에 추가: "기억 조각 · 빈자리 #4: 나는 삼류 브로커가 아니었다. 3년 전 리엔의 수석 연구원이었고, 정화된 외부의 하늘을 본 뒤 이 열쇠(칩 #00)를 들고 스스로 기억을 지운 채 슬럼가로 내려왔던 피험자였다." (개인 서사의 정점이니 함부로 남발하지 말 것)',
    next: [
      'ENDING_REN_MONOPOLY',
      'ENDING_KAEL_SILENCE',
      'ENDING_ECHO_BREAKOUT',
      'ENDING_NEXUS_TRUST',
      'ENDING_JAYNE_ORIGIN',
      'ENDING_SOLO_EXIT',
    ],
    gate: {
      ENDING_REN_MONOPOLY: 'Ren affinity가 최고이고 플레이어가 독점/거래를 최종 선택할 때',
      ENDING_KAEL_SILENCE: 'Kael affinity가 최고이고 플레이어가 은폐/질서를 최종 선택할 때',
      ENDING_ECHO_BREAKOUT: 'Echo affinity가 최고이고 플레이어가 파괴/탈출을 최종 선택할 때',
      ENDING_NEXUS_TRUST:
        '세 NPC 모두 suspicion<70이고 최소 두 명의 affinity≥60이며 추적도가 낮을 때 개방(히든).',
      ENDING_JAYNE_ORIGIN: '빈자리 조각 4개를 모두 모아 제인의 정체가 밝혀질 때(개인 진엔딩).',
      ENDING_SOLO_EXIT: '어느 세력과도 강하게 연대하지 않았을 때(홀로 걷는 길).',
    },
    endingChoiceNode: true, // engine injects ELIGIBLE_ENDINGS here
  },

  // ---------------- ENDINGS ----------------
  ENDING_REN_MONOPOLY: {
    act: 'Ending',
    title: '엔딩 · 초록의 값',
    npc: 'Ren',
    tone: 'Normal',
    beatBudget: 1,
    setting: '정화된 외부 토지 1,200만 평이 경매 도표 위에서 구획으로 잘려나간다.',
    goal: '자본이 자유를 상품화한 결말을 각인시키고 게임을 마무리한다.',
    beats: ['외부는 열렸으나 또 다른 울타리가 세워진다.', '제인의 마지막 독백으로 여운을 남긴다.'],
    npcVoice: '렌(엔딩 대사): "진실? 그건 개발되지 않은 노다지일 뿐이야. 지분 계약서에 서명해, 파트너."',
    ending: true,
    next: [],
  },
  ENDING_KAEL_SILENCE: {
    act: 'Ending',
    title: '엔딩 · 묻힌 하늘',
    npc: 'Kael',
    tone: 'Melancholy',
    beatBudget: 1,
    setting: '진실은 봉인되고 도시는 어제와 똑같은 가짜 아침을 맞는다.',
    goal: '질서를 위해 진실을 매장한 결말을 각인시킨다.',
    beats: ['평온하지만 공허한 도시.', '카엘과 제인만이 아는 침묵의 무게.'],
    npcVoice: '카엘(엔딩 대사): "질서는 지켜졌다. 하늘이 가짜라 할지라도, 이 평화는 진짜다."',
    ending: true,
    next: [],
  },
  ENDING_ECHO_BREAKOUT: {
    act: 'Ending',
    title: '엔딩 · 부서진 요람',
    npc: 'Echo',
    tone: 'Danger',
    beatBudget: 1,
    setting: 'NEXUS가 붕괴한다. 장벽이 무너지며 자욱한 연기 너머로 진짜 태양빛이 쏟아진다. 밖은 초록이지만, 도시는 폐허다.',
    goal: '대가를 치른 급진적 자유의 결말을 각인시킨다.',
    beats: ['밖으로 나간 자와 잔해에 남은 자.', '자유의 첫 숨과 그 값을 대비시킨다.'],
    npcVoice: '에코(엔딩 대사): "피가 흘러도 상관없어. 이제야 비로소 우리는 진짜 숨을 쉬는 거다."',
    ending: true,
    next: [],
  },
  ENDING_NEXUS_TRUST: {
    act: 'Ending',
    title: '엔딩 · 열린 요람 (히든)',
    npc: 'NEXUS',
    tone: 'Forest_Glitch',
    beatBudget: 1,
    setting: '리엔의 의식이 스스로 셧다운되며, 도시의 거대한 장벽 문이 서서히 내려앉는다. 가짜 멸망 영상이 꺼진다.',
    goal: '가두지 않는 신뢰라는 제4의 길로 마무리하는 히든 엔딩.',
    beats: [
      '설계자가 통제를 내려놓고 선택권을 인간에게 돌려준다.',
      '제인이 세 세력을 화해시킨 대가로 얻은, 조건 없는 하늘.',
    ],
    npcVoice:
      '리엔(엔딩 대사): "아마도 내가 틀렸을지 모르겠구나… 가서 보여다오. 너희가 다시 살아갈 자격이 있음을."',
    ending: true,
    next: [],
  },
  ENDING_JAYNE_ORIGIN: {
    act: 'Ending',
    title: '엔딩 · 되찾은 이름',
    npc: 'NEXUS',
    tone: 'Forest_Glitch',
    beatBudget: 1,
    setting:
      '코어의 빛 속에서 리엔의 의식과 제인의 지워진 3년이 맞닿는다. 제인은 자신이 한때 섹터 9에서 리엔의 수석 연구원이었고, 진실을 알아버려 스스로 기억을 지운 채 아래로 버려졌음을 깨닫는다. 잃어버렸던 이름표를 가슴에 달고, 외부에서 불어오는 진짜 바람을 맞이한다.',
    goal: '개인 서사의 정점 — 잃어버린 정체를 되찾는 진엔딩.',
    beats: [
      '빈자리 조각들이 하나로 이어지며 제인의 과거가 복원된다.',
      '“나는 너를 살리려 지웠다”는 리엔의 마지막 고백.',
      '세계의 진실과 자신의 진실이 같은 문장이었음을 마주한다.',
    ],
    npcVoice: '제인(엔딩 대사): "내 이름은 NEXUS가 지어준 번호가 아니다. 내가 이 문을 열기 위해 돌아왔다."',
    ending: true,
    next: [],
  },
  ENDING_SOLO_EXIT: {
    act: 'Ending',
    title: '엔딩 · 홀로 걷는 길',
    npc: 'NEXUS',
    tone: 'Melancholy',
    beatBudget: 1,
    setting: '세 세력 모두를 뿌리친 제인이 원본 칩을 배낭에 넣은 채, 홀로 푸른 황무지를 향해 걸어나간다.',
    goal: '고독한 자유의 결말 — 연대 없이 혼자 선택한 밖.',
    beats: ['등 뒤로 남겨진 도시와 세 세력.', '초록 지평선을 홀로 마주하는 제인의 뒷모습.'],
    npcVoice: '제인(엔딩 대사): "세력도, 규정도, 가격도 없다. 이제부터 내 기억은 내가 만든다."',
    ending: true,
    next: [],
  },
}

// Return a compact anchor block for the current node (token-cheap).
// Only sent for the active story_branch each turn.
export function sceneAnchor(nodeId, turnsOnNode = 0) {
  const s = SCENES[nodeId]
  if (!s) return ''
  const lines = [
    `NODE ${nodeId} — [${s.act}] "${s.title}"`,
    `STAGE_NPC: ${s.npc}`,
    `SETTING: ${s.setting}`,
    `GOAL: ${s.goal}`,
    `BEATS: ${s.beats.join(' / ')}`,
  ]
  // Character voice + backstory come from author-edited registries.
  const vb = voiceBlock(s.npc)
  if (vb) lines.push(vb)
  const bb = backstoryBlock(s.npc)
  if (bb) lines.push(bb)
  // Optional per-scene tweak on top of the global voice.
  if (s.npcVoice) lines.push(`SCENE_VOICE_NOTE: ${s.npcVoice}`)
  if (s.dilemma) lines.push(`DILEMMA: ${s.dilemma}`)
  if (s.actionHints) lines.push(`ACTION_HINTS: ${s.actionHints}`)
  if (s.keyEvidence) lines.push(`KEY_EVIDENCE: ${s.keyEvidence}`)
  if (s.revealsFragment) lines.push(`FRAGMENT_ON_REVEAL: ${s.revealsFragment}`)
  if (s.jayneHook) lines.push(`JAYNE_HOOK: ${s.jayneHook}`)
  // Pacing signal: how many turns already spent vs the node's budget.
  const budget = s.beatBudget || 2
  const pacing =
    turnsOnNode + 1 >= budget
      ? `PACING: budget reached (turn ${turnsOnNode + 1}/${budget}) — resolve this scene's goal and MOVE to an ALLOWED_NEXT node this turn.`
      : `PACING: turn ${turnsOnNode + 1}/${budget} on this node — keep developing; do NOT advance yet unless the player forces it.`
  lines.push(pacing)
  if (s.gate) {
    const g = Object.entries(s.gate)
      .map(([to, cond]) => `${to} <= ${cond}`)
      .join(' | ')
    lines.push(`ROUTING: ${g}`)
  }
  lines.push(
    `ALLOWED_NEXT: ${s.ending ? '(none — this is an ending; keep story_branch here)' : s.next.join(', ')}`
  )
  return lines.join('\n')
}

export function isEnding(nodeId) {
  return !!SCENES[nodeId]?.ending
}

// ---- Ending eligibility (deterministic gate) ------------------------------
// Given the player's save, compute which endings are currently unlockable.
// The engine passes this list to the AI, which then picks ONE from it based on
// the player's final choice — so systems (affinity, suspicion, trace, flags,
// fragments) concretely decide which finales are on the table.
export function eligibleEndings(save) {
  const rel = save.relationships || {}
  const A = (n) => rel[n]?.affinity ?? 0
  const S = (n) => rel[n]?.suspicion ?? 0
  const factions = ['Ren', 'Kael', 'Echo']
  const maxA = Math.max(...factions.map(A))
  const top = factions.find((n) => A(n) === maxA)
  const gapCount = (save.fragments || []).filter((f) => /빈자리/.test(f)).length
  const twoTrusted = factions.filter((n) => A(n) >= 50).length >= 2
  const allCalm = factions.every((n) => S(n) < 70)
  const heat = save.heat || 0

  const out = []
  // Personal true-ending: all four "빈자리" (gap) fragments recovered.
  if (gapCount >= 4) out.push('ENDING_JAYNE_ORIGIN')
  // Hidden trust-ending: everyone calm, broad trust, and you stayed off the grid.
  if (allCalm && twoTrusted && heat < 70) out.push('ENDING_NEXUS_TRUST')
  // Faction endings: only if you actually built an alliance.
  if (maxA >= 20) {
    if (top === 'Ren') out.push('ENDING_REN_MONOPOLY')
    if (top === 'Kael') out.push('ENDING_KAEL_SILENCE')
    if (top === 'Echo') out.push('ENDING_ECHO_BREAKOUT')
  }
  // Lone-wolf ending: no strong ally.
  if (maxA < 20) out.push("ENDING_SOLO_EXIT")
  // Safety net — never leave the finale with nowhere to go.
  if (out.length === 0) out.push('ENDING_SOLO_EXIT')
  return [...new Set(out)]
}

// ---- Playtime estimate ------------------------------------
// Sum of beatBudgets along the SHORTEST path from a node to any ending.
// Used to tell the player roughly how many turns / minutes remain.
const SEC_PER_TURN = 40 // ~read + decide + AI latency

function turnsToEnding(nodeId, seen = new Set()) {
  const s = SCENES[nodeId]
  if (!s) return 0
  if (s.ending) return s.beatBudget || 1
  if (seen.has(nodeId)) return 0
  seen.add(nodeId)
  const budget = s.beatBudget || 2
  const nexts = s.next || []
  if (nexts.length === 0) return budget
  const best = Math.min(...nexts.map((n) => turnsToEnding(n, new Set(seen))))
  return budget + best
}

// Full-playthrough estimate from the start node.
export function fullPlaythroughEstimate() {
  const turns = turnsToEnding('PROLOGUE_RAIN_01')
  return { turns, minutes: Math.round((turns * SEC_PER_TURN) / 60) }
}

// Remaining estimate from the player's current node.
export function remainingEstimate(nodeId, turnsOnNode = 0) {
  const s = SCENES[nodeId]
  if (!s) return { turns: 0, minutes: 0 }
  const remainingHere = Math.max(0, (s.beatBudget || 2) - turnsOnNode)
  let turns = remainingHere
  if (!s.ending && s.next?.length) {
    turns += Math.min(...s.next.map((n) => turnsToEnding(n)))
  }
  return { turns, minutes: Math.max(1, Math.round((turns * SEC_PER_TURN) / 60)) }
}
