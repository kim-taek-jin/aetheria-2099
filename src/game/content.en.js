// ============================================================
//  content.en.js — English for scene metadata that reaches the screen:
//  scene titles (footer, ending card), weak-point hints, memory fragments.
//
//  Fragments are stored in saves by their Korean text (evidence matching uses
//  Korean keywords), so FRAGMENTS_EN maps Korean original → English display.
// ============================================================

const ACT_EN = {
  Prologue: 'Prologue',
  'Act 1': 'Act 1',
  'Act 2 · Ren': 'Act 2 · Ren',
  'Act 2 · Kael': 'Act 2 · Kael',
  'Act 2 · Echo': 'Act 2 · Echo',
  'Act 3': 'Act 3',
  Ending: 'Ending',
}
export const actEn = (act) => ACT_EN[act] || act

export const SCENE_TITLE_EN = {
  PROLOGUE_RAIN_01: 'What the Rain Left Behind',
  PROLOGUE_CHOICE_01: 'The First Fork',
  ACT1_REN_GARAGE_01: 'Traders Underground',
  ACT1_REN_GARAGE_02: 'How the Price Is Paid',
  ACT1_DECRYPT_01: 'The Last Cipher Layer',
  ACT1_SKY_GLITCH_01: 'Noise in a Blue Sky',
  ACT2_REN_AUCTION_01: "Ren's Auction",
  ACT2_REN_BACKROOM_01: 'Scales in the Back Room',
  ACT2_REN_LEDGER_01: 'The Ledger',
  ACT2_REN_AUCTION_02: 'The Price of the Winning Bid',
  ACT2_REN_SPLIT_01: 'Partition',
  ACT2_KAEL_INTERROGATION_01: "Kael's Interrogation Room",
  ACT2_KAEL_HOLDING_01: 'A Night in Holding',
  ACT2_KAEL_ARCHIVE_01: 'The Sealed Archive',
  ACT2_KAEL_INTERROGATION_02: 'A Crack in the Principle',
  ACT2_KAEL_ORDER_01: 'The Order',
  ACT2_ECHO_BROADCAST_01: "Echo's Station",
  ACT2_ECHO_MARTYR_01: 'Twelve Names',
  ACT2_ECHO_SIGNAL_01: 'Broadcast Range',
  ACT2_ECHO_COUNT_01: 'Headcount',
  ACT2_ECHO_BROADCAST_02: 'At the Broadcast Button',
  ACT3_CORE_APPROACH_01: 'The Road to the Cradle',
  ACT3_VIGIL_01: 'Who Walks With You to the Threshold',
  ACT3_DESIGNER_CONFRONT_01: 'The Paradox of the Cradle',
  ENDING_REN_MONOPOLY: 'Ending · The Price of Green',
  ENDING_KAEL_SILENCE: 'Ending · The Buried Sky',
  ENDING_ECHO_BREAKOUT: 'Ending · The Broken Cradle',
  ENDING_NEXUS_TRUST: 'Ending · The Open Cradle (Hidden)',
  ENDING_JAYNE_ORIGIN: 'Ending · A Name Reclaimed',
  ENDING_SOLO_EXIT: 'Ending · The Road Alone',
}

const WEAK_REN = 'Ren puts a price on everything. Show him the one thing he never could.'
const WEAK_KAEL = 'Kael hides behind regulations. Name the day he broke them.'
const WEAK_ECHO = "Echo doesn't want evidence, she wants certainty. Show her proof that life exists beyond the wall."
// 한국어 약점 문장 → 영어 (세 문장뿐이라 원문을 키로 쓴다).
export const WEAK_POINT_BY_KO = {
  '렌은 세상 모든 것에 값을 매긴다. 그가 값을 매기지 못한 단 하나를 들이대라.': WEAK_REN,
  '카엘은 규정 뒤에 숨는다. 그가 규정을 어겼던 그날의 이름을 꺼내라.': WEAK_KAEL,
  '에코는 증거가 아니라 확신을 원한다. 장벽 밖이 살아 있다는 기록을 보여라.': WEAK_ECHO,
}

export const FRAGMENTS_EN = {
  // gap fragments (true ending)
  '기억 조각 · 빈자리 #1: 그는 나를 알았다. 나는 그를 모른다. 내 지워진 3년 속의 얼굴일까.':
    "Memory fragment · Blank #1: He knew me. I don't know him. A face from my erased three years?",
  '기억 조각 · 빈자리 #2: 이 초록을 나는 전에 본 적 있다. 잊기 전의 내가, 저 밖에 있었나?':
    "Memory fragment · Blank #2: I've seen this green before. Was the me from before the forgetting out there?",
  "기억 조각 · 빈자리 #3: '잠들렴, 아침이 오면…' 어머니의 목소리가 아니었다. 3년 전 섹터 9 단말기 앞에서 내 머릿속에 직접 인코딩된 리엔의 오리지널 음성이었다.":
    "Memory fragment · Blank #3: 'Sleep now, when morning comes…' It wasn't my mother's voice. It was Lien's original recording, encoded straight into my head at a Sector 9 terminal three years ago.",
  '기억 조각 · 빈자리 #4: 나는 삼류 브로커가 아니었다. 3년 전 리엔의 수석 연구원이었고, 정화된 외부의 하늘을 본 뒤 이 열쇠(칩 #00)를 들고 스스로 기억을 지운 채 슬럼가로 내려왔던 피험자였다.':
    "Memory fragment · Blank #4: I was never a third-rate broker. Three years ago I was Lien's lead researcher — the test subject who saw the purified sky outside, took this key (chip #00), erased her own memory, and walked down into the slums.",
  // 체험판에서 가린 빈자리 #4 (edition.js REDACTED_GAP)
  '기억 조각 · 빈자리 #4: ██████ ███ ████. — 이 기억은 정식판에서 복원된다.':
    'Memory fragment · Blank #4: ██████ ███ ████. — This memory is restored in the full game.',
  // scene truths
  '기록 조각: 도시 밖 스카이라인이 회색이 아니었다. 잠깐이지만 — 초록이었다.':
    'Record fragment: The skyline outside the city was not gray. Only for a moment — it was green.',
  '기억 조각 · 미매각 칩 #00-X: 렌은 모든 물건에 값을 매겨 팔면서도, 정비소 비밀 함에 딱 하나를 숨겨 두었다 — 사랑했던 사람의 마지막 미소. 값을 매길 수 없는 유일한 것.':
    "Memory fragment · Unsold chip #00-X: Ren prices and sells everything, yet he hid exactly one thing in a secret box in his garage — the last smile of someone he loved. The only thing he can't price.",
  '기록 조각: 그는 나를 처음으로 "자산"이라 불렀다. 그 말이 모욕인지 신뢰인지, 렌 자신도 모르는 것 같았다.':
    'Record fragment: For the first time he called me an "asset." Whether that was an insult or trust, I don\'t think even Ren knew.',
  '기록 조각: 장부 세 번째 줄에 배달원의 이름이 있었다. 단가 옆에 "분할 완료"라고 적혀 있었다. 그는 죽어서도 나뉘어 팔리고 있었다.':
    "Record fragment: The courier's name was on the third line of the ledger. Next to the unit price: \"partition complete.\" Even dead, he was being sold in pieces.",
  '기록 조각: 그에게 진실은 상품이었고, 사람조차 손익계산서의 숫자에 불과했다. 그러나 그 숫자의 바닥에는, 결코 팔아치우지 못한 단 하나의 기억이 흉터처럼 남아 있었다.':
    'Record fragment: To him truth was a product, and even people were numbers on a balance sheet. But at the bottom of those numbers, like a scar, was the one memory he could never sell.',
  '기록 조각: 분할기 소리는 생각보다 조용했다. 사람 하나가 조각나는 데 4분이면 충분하다는 것을, 나는 그날 알았다.':
    'Record fragment: The partitioner was quieter than I expected. That day I learned four minutes is enough to break a person into pieces.',
  '기억 조각 · 아렌의 인식표: 20년 전 대붕괴에서 카엘이 눈감아 탈출시켰으나 결국 사살당한 진실 추적자 아렌. 그의 군용 인식표 데이터를, 제인은 여태 품고 있었다.':
    "Memory fragment · Aren's dog tag: Aren, the truth-seeker Kael looked away and let escape in the Collapse twenty years ago — who was shot dead anyway. Jayne has been carrying his military tag data all this time.",
  '기록 조각: 완벽한 심문관도 자정엔 커피 두 잔을 들고 온다. 규정에 없는 그 한 잔이, 그가 아직 사람이라는 유일한 증거였다.':
    "Record fragment: Even the perfect interrogator brings two coffees at midnight. That extra cup, which isn't in any regulation, was the only proof he was still human.",
  '기록 조각: 내 3년은 분실된 것이 아니었다. 결재란에 서명이 있었다. 사람이 손으로 지운 것이었다.':
    'Record fragment: My three years were not lost. There was a signature on the authorization line. A person erased them, by hand.',
  '기록 조각: 그의 완벽한 규정 집행은 신념이 아니었다. 다시는 내 손으로 누군가의 죽음을 묵인하지 않겠다는, 20년 묵은 절박한 두려움의 이명이었다.':
    'Record fragment: His perfect enforcement was never conviction. It was the ringing of a twenty-year-old terror — that never again would he let someone die by looking away.',
  '기록 조각: 그는 회선을 끊지 않았다. 내가 듣는 앞에서 대답하기 위해서였다. 그 선택으로 그는 제복을 잃었다.':
    "Record fragment: He didn't cut the line. He wanted to answer where I could hear. That choice cost him the uniform.",
  '기록 조각 · 열두 개의 이름: 에코의 자유에는 언제나 이름표가 붙은 잔해가 따랐다. 그녀는 그 이름들을 잊기 위해서가 아니라, 기억하기 위해 싸운다.':
    "Record fragment · Twelve names: Echo's freedom has always left wreckage with name tags on it. She fights not to forget those names, but to remember them.",
  '기록 조각 · 송출 범위도: 에코의 설계도에는 숫자 하나가 손으로 적혀 있었다. 깨어나는 대신 자기 이름을 잃을 사람의 수. 그녀는 그 숫자를 지우지 않았다.':
    "Record fragment · Broadcast range map: One number was handwritten on Echo's blueprint. How many people would lose their own names in exchange for waking up. She never erased it.",
  '기록 조각: 모스는 방송 현장에 없었다. 열두 개의 이름 옆에, 에코는 이름 하나를 더 쓸지 오래 망설였다. 죽은 사람이 아니었는데도.':
    "Record fragment: Morse wasn't there for the broadcast. Beside the twelve names, Echo hesitated a long time over whether to write one more. Even though he wasn't dead.",
  '기록 조각: 에코의 자유에는 언제나 누군가의 이름표가 붙은 잔해가 따랐다.':
    "Record fragment: Echo's freedom has always left wreckage with someone's name tag on it.",
  '기록 조각: 요람과 감옥은 같은 설계도에서 태어났다.': 'Record fragment: The cradle and the prison were drawn from the same blueprint.',
  '기록 조각: 문턱 앞에서야 알았다. 누구와 여기까지 왔는가가, 그 문 너머의 내가 누구일지를 정한다.':
    'Record fragment: Only at the threshold did I understand. Who I came here with decides who I will be on the other side of that door.',
  '기록 조각: “나는 너희를 사랑했다. 그래서 가두었다.” 그 일그러진 애정이 50년 동안 이 도시를 감싸고 있던 비극의 시작이자 마지막 사슬이었다.':
    'Record fragment: "I loved you. So I locked you in." That twisted love was both the beginning of the tragedy that wrapped this city for fifty years and its last chain.',
}

// 표시용 번역(없으면 원문). 잔향 조각은 residue.js가 따로 가진다.
export function fragmentEn(ko) {
  return FRAGMENTS_EN[ko] || ko
}
