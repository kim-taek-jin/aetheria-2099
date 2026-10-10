// ============================================================
//  residue.js — 잔향(회차를 넘어 남는 기억).
//
//  제인은 기억을 지워진 사람이다. 그런데 플레이어는 지난 판을 기억한다.
//  이 어긋남을 시스템으로 만든다: 한 루트에서 알게 된 진실이 "잔향"으로
//  남고, 다음 판에서 그 진실을 쓰는 네 번째 선택지가 열린다.
//
//  세 루트가 서로의 열쇠가 되므로, 한 번 하고 끝나는 게임이 아니게 된다.
//  엔딩 수집(collection.js)이 "다른 결말을 보러 다시 하게" 만든다면,
//  잔향은 "다시 할 때 같은 장면이 다르게 읽히게" 만든다.
//
//  잔향 선택은 씬을 진전시키지 않는다 — 그 자리에서 판을 흔드는 한 수다.
//  쓰고 나면 그 판에서는 다시 나오지 않는다(flags.residue_used_<id>).
// ============================================================

import { IS_DEMO, isLockedNode, isWithheldGap } from './edition.js'

export const RESIDUE_KEY = 'aetheria2099.residue.v1'

// 어디서 얻는가. 장면에 진입하는 것만으로 남는다(그 장면의 진실을 봤으므로).
export const RESIDUES = {
  ledger: {
    from: 'ACT2_REN_LEDGER_01',
    label: '렌의 장부',
    hint: '렌은 칩을 팔지 않는다. 죽은 사람의 기억을 쪼개 판다. 배달원의 이름이 그 장부에 있었다.',
  },
  signature: {
    from: 'ACT2_KAEL_ARCHIVE_01',
    label: '41층의 서명',
    hint: '제인의 3년은 분실이 아니었다. 결재란에 서명이 있었고, 그 자리는 코어 스파이어 41층이다.',
  },
  cutpoints: {
    from: 'ACT2_ECHO_SIGNAL_01',
    label: '절단 지점 열일곱',
    hint: '에코의 방송은 진실을 알리는 게 아니다. 기억 동기화를 끊는다. 깨어나는 사람은 자기 이름을 잃는다.',
  },
  // 루트의 절정에서 남는 잔향. 중반 잔향이 "그 세력이 무엇을 하는가"라면,
  // 이쪽은 "그 사람을 어떻게 멈추는가"다 — 다음 판에서 무기가 된다.
  name: {
    from: 'ACT2_REN_SPLIT_01',
    label: '분할기 앞의 4분',
    hint: '렌은 이름이 붙은 것에 값을 매기지 못한다. 그래서 그의 벽에 걸린 것들은 전부 번호다.',
  },
  order: {
    from: 'ACT2_KAEL_ORDER_01',
    label: '복창하지 않은 3초',
    hint: '카엘의 명령서는 전부 41층에서 내려왔다. 그리고 그는 한 번 복창하지 않았다 — 규정상 침묵은 불복이다.',
  },
  mose: {
    from: 'ACT2_ECHO_COUNT_01',
    label: '모스의 어머니',
    hint: '동기화가 끊기면 요양 구역 사람들은 가족을 알아보지 못한다. 에코의 가장 어린 해커가 그걸 알고 걸어 나갔다.',
  },
}
export const RESIDUE_COUNT = Object.keys(RESIDUES).length

// 장면 → 그 장면이 남기는 잔향 id
export const RESIDUE_FROM = Object.fromEntries(Object.entries(RESIDUES).map(([id, r]) => [r.from, id]))

// ---- 판본 경계 ----
// 체험판에서 얻을 수 있는 잔향 = **출처 장면이 체험판에 열려 있는 것**.
// 목록을 따로 적지 않는다 — 잔향을 추가해도 규칙이 알아서 맞는다.
//
// 분모를 판본별로 나누는 이유: 체험판에서 전체 개수를 분모로 쓰면 "N개 중 1개"가 되어
// 한 판을 온전히 끝내고도 실패한 것처럼 보인다. 체험판은 렌 루트의 잔향만 세서
// "2개 중 2개"로 **완결되어 보여야** 하고, 못 가진 것은 결말 화면의 안내로만 알린다.
export function residueAvailable(id, demo = IS_DEMO) {
  const from = RESIDUES[id]?.from
  if (!from) return false
  if (!demo) return true
  return !isLockedNode(from, demo) && !isWithheldGap(from, demo)
}

export const residueIds = (demo = IS_DEMO) => Object.keys(RESIDUES).filter((id) => residueAvailable(id, demo))
export const residueTotal = (demo = IS_DEMO) => residueIds(demo).length
// 정식판에만 있는 잔향 수 — 결말 화면·업셀의 "몇 개가 더 있는가".
export const residueLockedCount = (demo = IS_DEMO) => (demo ? residueTotal(false) - residueTotal(true) : 0)

// 이 판본에서 보여줄 목록과 진행도. 가진 것이 분모를 넘지 않는다
// (정식판을 하던 브라우저로 체험판을 열어도 "2/2"가 "3/2"가 되지 않는다).
export function residueProgress(known, demo = IS_DEMO) {
  const ids = residueIds(demo)
  const k = new Set(Array.isArray(known) ? known : [])
  return { ids, have: ids.filter((id) => k.has(id)).length, total: ids.length }
}

// ---- 어디서 쓰는가 ----
// 잔향 하나당 두 곳. 하나는 모든 루트가 지나는 공통 장면, 하나는 다른 루트의 장면 —
// 그래서 어느 루트로 다시 들어가도 지난 판의 기억이 쓸모를 가진다.
export const RESIDUE_CHOICES = {
  ACT1_REN_GARAGE_01: [
    {
      id: 'ledger_garage',
      requires: 'ledger',
      text: '[잔향] 렌에게 장부 세 번째 줄의 이름을 말한다.',
      tone: 'Investigate',
      reaction: {
        narration:
          '제인이 이름 하나를 말한다. 정비소의 소음이 그대로인데, 렌의 손만 멈춘다.\n\n' +
          '그는 단말을 내려다본다. 장부를 연다. 세 번째 줄은 비어 있다. ' +
          '아직 아무도 그 기억을 팔지 않았다. 렌조차 아직 그 이름을 모른다.',
        line: '…그 이름 어디서 들었어? 시장에 없는 이름이야. 내 장부에도 아직 없고. 너, 내 장부를 나보다 먼저 읽은 거야?',
        emotion: 'Suspicious',
      },
      effects: { affinity: 6, suspicion: 8 },
      fragments: ['기록 조각 · 잔향: 렌은 아직 사지 않은 기억의 주인 이름을 들었다. 그는 처음으로 제인을 시세표가 아니라 위험으로 봤다.'],
    },
    {
      id: 'name_garage',
      requires: 'name',
      text: '[잔향] 벽에 걸린 부품 하나를 가리키며 이름을 붙여보라고 한다.',
      tone: 'Investigate',
      reaction: {
        narration:
          '제인이 벽을 가리킨다. 번호표가 달린 부품 수백 개. 렌은 영문을 모른 채 하나를 집어 든다.\n\n' +
          '그리고 멈춘다. 20년 동안 그는 아무것에도 이름을 붙인 적이 없다. 번호가 편해서가 아니다. ' +
          '이름이 붙은 것에는 값을 매기지 못해서다. 그는 부품을 도로 건다.',
        line: '…왜 그런 걸 시켜. 번호가 편한 거야. 이름 붙이면 못 팔아. …너 방금 나한테 무슨 짓 한 거야?',
        emotion: 'Suspicious',
      },
      effects: { affinity: 5, suspicion: 6 },
      fragments: ['기록 조각 · 잔향: 렌의 벽에 이름이 붙은 물건은 하나도 없었다. 값을 매기려면 먼저 이름을 지워야 한다.'],
    },
  ],
  ACT2_ECHO_MARTYR_01: [
    {
      id: 'ledger_martyr',
      requires: 'ledger',
      text: '[잔향] 이 이름들이 렌의 장부에서 팔리고 있다고 말한다.',
      tone: 'Honest',
      reaction: {
        narration:
          '에코가 촛불 쪽으로 돌아선다. 열두 개의 이름을 하나씩 손끝으로 짚는다. ' +
          '세 번째 이름에서 손이 멈춘다.\n\n' +
          '그녀는 오래 그 자리에 서 있다. 촛농이 손등에 떨어지는데도 손을 거두지 않는다.',
        line: '…죽어서도 값이 매겨지는구나. 나는 이 사람들을 기억하려고 싸웠는데, 누군가는 이 사람들을 팔려고 기억하고 있었어.',
        emotion: 'Threatening',
      },
      effects: { affinity: 10, suspicion: -4 },
      rivalEffects: { npc: 'Ren', affinity_change: -8, suspicion_change: 10 },
    },
    {
      id: 'name_martyr',
      requires: 'name',
      text: '[잔향] 렌의 회선을 켜 둔 채, 벽의 열두 이름을 소리 내어 읽는다.',
      tone: 'Aggressive',
      reaction: {
        narration:
          '제인이 단말을 벽 쪽으로 돌린다. 그리고 촛불 아래 번진 이름을 하나씩 읽는다. 열둘.\n\n' +
          '회선 너머에서 45라는 숫자가 다시 나오지 않는다. 숨소리만 남다가, 렌이 먼저 끊는다. ' +
          '그는 값을 부르다 말았다.',
        line: '…방금 뭘 한 거야. 저 사람, 값을 부르다 말았어. 이름을 들으면 못 부르는구나, 저런 사람은.',
        emotion: 'Friendly',
      },
      effects: { affinity: 8, suspicion: -3 },
      rivalEffects: { npc: 'Ren', affinity_change: -10, suspicion_change: 6 },
      fragments: ['기록 조각 · 잔향: 렌은 이름을 들은 물건에 값을 부르지 못했다. 그를 멈추는 방법은 더 높은 값이 아니라 이름이었다.'],
    },
  ],
  ACT1_DECRYPT_01: [
    {
      id: 'signature_decrypt',
      requires: 'signature',
      text: '[잔향] 복호화 키에 "41층"을 입력한다.',
      tone: 'Hack',
      reaction: {
        narration:
          '화면이 한 번 하얗게 빈다. 그리고 거절 메시지 대신 문장 하나가 뜬다.\n\n' +
          '— 결재권자 접근은 이 단말에서 허용되지 않습니다. 이 시도는 기록되었습니다.\n\n' +
          '틀린 키라면 "오류"가 떴어야 한다. 시스템은 오류라고 하지 않았다. 41층이 무엇인지 알고 있다는 뜻이다.',
        line: '시민 제인. 해당 층위는 존재하지 않습니다. 존재하지 않는 층위를 어떻게 알고 계십니까?',
        emotion: 'Threatening',
      },
      effects: { suspicion: 6, heat: 6 },
      fragments: ['기록 조각 · 잔향: NEXUS는 41층을 "존재하지 않는다"고 했다. 존재하지 않는 것을 지키느라 경보까지 울렸다.'],
    },
  ],
  // 분기점 — 세 세력이 동시에 손을 내미는 자리. 지난 판의 기억이 가장 쓸모 있는 곳이다.
  // 고르기 전에 상대를 한 번 찔러볼 수 있게 한다.
  ACT1_SKY_GLITCH_01: [
    {
      id: 'order_sky',
      requires: 'order',
      text: '[잔향] 경비대 회선에 "사십일"이라고만 말한다.',
      tone: 'Honest',
      reaction: {
        narration:
          '제인이 숫자 두 개를 말한다. 청백색 노이즈가 뚝 끊긴다. 회선은 닫히지 않았는데 아무 소리도 나지 않는다.\n\n' +
          '카엘 — "…그 숫자는 회선에서 말하는 게 아니다. 지금 당장 끊어라."\n\n' +
          '명령의 말투가 아니다. 경고다. 세 개의 손 중 하나가 처음으로 제인 쪽에 빚을 졌다.',
        line: '시민 제인. 해당 층위는 존재하지 않습니다. …경비대 회선의 응답 지연 3초를 기록합니다.',
        emotion: 'Threatening',
      },
      effects: { heat: 4 },
      rivalEffects: { npc: 'Kael', affinity_change: 8, suspicion_change: -4 },
      fragments: ['기록 조각 · 잔향: 카엘은 41층을 회선에서 말하지 말라고 했다. 금지가 아니라 경고의 말투였다.'],
    },
    {
      id: 'mose_sky',
      requires: 'mose',
      text: '[잔향] 해적 주파수에 요양 구역은 어떻게 되냐고 묻는다.',
      tone: 'Investigate',
      reaction: {
        narration:
          '웃음이 멎는다. 해적 주파수가 오래 지직거린다. 에코는 거짓말을 하지 않는다 — 그게 더 나쁘다.\n\n' +
          '에코 — "…못 알아봐. 한동안은. 알고 물은 거지. 너 그거 어떻게 알았어."\n\n' +
          '세 회선이 전부 열려 있다. 렌도, 카엘도 그 대답을 들었다.',
        line: '요양 구역의 동기화 의존자 수를 말씀드릴까요. …아니군요. 시민 제인, 당신은 방금 내가 하려던 말을 대신했습니다.',
        emotion: 'Neutral',
      },
      effects: { heat: 2 },
      rivalEffects: { npc: 'Echo', affinity_change: 5, suspicion_change: 7 },
      fragments: ['기록 조각 · 잔향: 요양 구역 사람들은 동기화가 끊기면 가족을 못 알아본다. 에코는 그걸 알면서 송출을 준비하고 있었다.'],
    },
  ],
  ACT2_REN_AUCTION_01: [
    {
      id: 'order_auction',
      requires: 'order',
      text: '[잔향] 오늘 밤 경비대는 오지 않는다고 렌에게 말한다.',
      tone: 'Honest',
      reaction: {
        narration:
          '제인이 말한다. 이 구역 담당 장교는 명령을 복창하기 전에 3초를 쓴다고. ' +
          '3초를 쓰는 사람은 자정에 남의 문을 걷어차지 않는다고.\n\n' +
          '렌은 그 말을 믿지 않는다. 그런데 최저가를 올린다. 그리고 새벽까지 아무도 오지 않는다.',
        line: '…너 방금 경비대 하나를 읽었어. 사람 읽는 건 내 일인데. 제인, 너 지워지기 전에 뭐 하던 사람이야?',
        emotion: 'Suspicious',
      },
      effects: { affinity: 7, suspicion: 5, heat: -4 },
      fragments: ['기록 조각 · 잔향: 제인은 경비대 장교가 망설이는 3초를 알고 있었다. 그것을 어디서 배웠는지는 모른다.'],
    },
  ],
  ACT2_REN_BACKROOM_01: [
    {
      id: 'signature_backroom',
      requires: 'signature',
      text: '[잔향] 렌에게 41층과 거래한 적 있냐고 묻는다.',
      tone: 'Investigate',
      reaction: {
        narration:
          '렌이 계약서를 접는다. 웃지 않는다. 그는 뒷방의 문이 닫혀 있는지 한 번 확인하고, 목소리를 낮춘다.\n\n' +
          '그가 꺼낸 장부의 맨 아래 칸에 구매처가 하나 있다. 이름 대신 숫자 41.',
        line: '…내 최대 고객이야. 내가 쪼갠 기억을 제일 비싸게 사 가. 왜 사는지는 안 물어봤어. 묻지 않는 게 그 값에 포함돼 있었거든. …근데 넌 왜 그 숫자를 알아?',
        emotion: 'Suspicious',
      },
      effects: { affinity: 4, suspicion: 6 },
      rivalEffects: { npc: 'Kael', suspicion_change: 6 },
      fragments: ['기록 조각 · 잔향: 렌이 쪼갠 기억을 가장 비싸게 사는 곳은 41층이었다. 지우는 자와 파는 자가 같은 장부에 있었다.'],
    },
  ],
  ACT2_KAEL_HOLDING_01: [
    {
      id: 'cutpoints_holding',
      requires: 'cutpoints',
      text: '[잔향] 에코가 하려는 일을 먼저 말해준다.',
      tone: 'Honest',
      reaction: {
        narration:
          '제인이 말한다. 방송이 아니라 절단이라고. 깨어나는 사람들이 자기 이름을 잃는다고.\n\n' +
          '카엘은 커피잔을 내려놓는다. 그는 그걸 막는 것이 자기 일이라는 걸 안다. ' +
          '그리고 그 일이 처음으로 옳게 느껴진다는 것이 그를 불편하게 만든다.',
        line: '…그걸 왜 나한테 말하지. 당신은 지금 반군을 팔았다. 아니면 — 그 사람들을 구한 건가. 어느 쪽인지 당신은 아나?',
        emotion: 'Neutral',
      },
      effects: { affinity: 9, suspicion: -3 },
      rivalEffects: { npc: 'Echo', affinity_change: -6, suspicion_change: 8 },
    },
    {
      id: 'mose_holding',
      requires: 'mose',
      text: '[잔향] 귓속의 수신기에 대고, 요양 구역에 어머니를 둔 애는 어쩔 거냐고 묻는다.',
      tone: 'Honest',
      reaction: {
        narration:
          '제인이 아주 작은 소리로 묻는다. 그 애한테는 뭐라고 할 거냐고.\n\n' +
          '주파수가 대답하지 않는다. 4초쯤 지나 지직거림이 끊긴다. 벽을 세 번 두드릴 기회도 같이 끊긴다.\n\n' +
          '카엘은 아무것도 듣지 못했다. 그는 제인의 얼굴만 본다.',
        line:
          '방금 누구와 이야기했나. …아니, 됐다. 당신은 열리던 문 하나를 스스로 닫았다. ' +
          '어떤 문인지 나는 모른다. 다만 당신 얼굴이, 닫아서 다행이라는 얼굴은 아니군.',
        emotion: 'Neutral',
      },
      effects: { affinity: 8, suspicion: -2 },
      rivalEffects: { npc: 'Echo', affinity_change: -7, suspicion_change: 9 },
      fragments: ['기록 조각 · 잔향: 제인은 열리던 문을 스스로 닫았다. 모스의 어머니가 아들을 알아보는 쪽을 골랐다.'],
    },
  ],
  ACT3_CORE_APPROACH_01: [
    {
      id: 'cutpoints_core',
      requires: 'cutpoints',
      text: '[잔향] NEXUS에게 동기화가 끊기면 무엇이 남는지 묻는다.',
      tone: 'Honest',
      reaction: {
        narration:
          '코어로 가는 통로의 조명이 한 단계 어두워진다. 대답이 늦다. NEXUS가 대답을 늦게 하는 것은 처음이다.',
        line: '당신들이 버린 것들이 남습니다. 나는 그것을 대신 들고 있었습니다. 내려놓으면, 아무도 그것을 들지 않을 것입니다. …그래도 내려놓기를 원하십니까?',
        emotion: 'Neutral',
      },
      effects: { heat: -5 },
      fragments: ['기록 조각 · 잔향: NEXUS는 "대신 들고 있었다"고 했다. 감시가 아니라 짐이라는 말투였다.'],
    },
  ],
}

// ---- English ----
export const RESIDUES_EN = {
  ledger: {
    label: "Ren's Ledger",
    hint: "Ren doesn't sell the chip. He breaks dead people's memories into pieces and sells those. The courier's name was in his ledger.",
  },
  signature: {
    label: 'The Signature on Floor 41',
    hint: "Jayne's three years weren't lost. There was a signature on the order, and the desk behind it is on Floor 41 of the Core Spire.",
  },
  cutpoints: {
    label: 'Seventeen Cut Points',
    hint: "Echo's broadcast isn't about spreading the truth. It severs memory sync. The people who wake up lose their own names.",
  },
  name: {
    label: 'Four Minutes at the Splitter',
    hint: "Ren can't put a price on anything that has a name. That's why everything on his wall is a number.",
  },
  order: {
    label: 'The Three Seconds He Never Repeated',
    hint: "Every order Kael received came down from Floor 41. And once, he didn't repeat one back — by regulation, silence is refusal.",
  },
  mose: {
    label: "Mose's Mother",
    hint: "If the sync is cut, people in the care sector stop recognizing their families. Echo's youngest hacker knew that, and walked out.",
  },
}

// 선택 id → 영어 글. 효과·조건은 한국어 정의에서 온다.
export const RESIDUE_CHOICES_EN = {
  ledger_garage: {
    text: "[Residue] Tell Ren the name on the third line of his ledger.",
    reaction: {
      narration:
        "Jayne says a name. The garage noise doesn't change, but Ren's hands stop.\n\n" +
        "He looks down at his terminal. Opens the ledger. The third line is empty. " +
        "No one has sold that memory yet. Not even Ren knows that name yet.",
      line: "…Where'd you hear that name? It's not on the market. It's not even in my ledger yet. Did you read my books before I did?",
    },
  },
  ledger_martyr: {
    text: "[Residue] Tell her these names are being sold in Ren's ledger.",
    reaction: {
      narration:
        'Echo turns toward the candles. She touches the twelve names one by one. ' +
        'At the third, her hand stops.\n\n' +
        "She stands there a long time. Wax drips onto the back of her hand and she doesn't pull it away.",
      line: "…So they put a price on you even after you're dead. I fought to remember these people, and someone was remembering them so they could sell them.",
    },
  },
  signature_decrypt: {
    text: '[Residue] Enter "Floor 41" as the decryption key.',
    reaction: {
      narration:
        'The screen goes white for a moment. Then, instead of a rejection, a single sentence appears.\n\n' +
        '— Authorizer access is not permitted from this terminal. This attempt has been logged.\n\n' +
        'A wrong key should have returned "error." The system didn\'t say error. It knows what Floor 41 is.',
      line: 'Citizen Jayne. That level does not exist. How do you know of a level that does not exist?',
    },
  },
  signature_backroom: {
    text: '[Residue] Ask Ren if he has ever dealt with Floor 41.',
    reaction: {
      narration:
        "Ren folds the contract. He doesn't smile. He checks that the back-room door is shut, then lowers his voice.\n\n" +
        'At the bottom of the ledger he pulls up, there is one buyer. No name. Just the number 41.',
      line: "…My biggest client. Pays top price for the memories I split. Never asked why. Not asking was part of the price. …So how do you know that number?",
    },
  },
  cutpoints_holding: {
    text: '[Residue] Tell him what Echo is about to do — before she does it.',
    reaction: {
      narration:
        "Jayne tells him. Not a broadcast — a severing. The people who wake up will lose their own names.\n\n" +
        "Kael sets down his coffee. He knows stopping it is his job. " +
        'And for the first time, the job feels right — which is exactly what makes him uneasy.',
      line: "…Why tell me? You just sold out the rebels. Or — did you just save those people? Do you know which?",
    },
  },
  cutpoints_core: {
    text: '[Residue] Ask NEXUS what remains if the sync is cut.',
    reaction: {
      narration: 'The lights in the corridor to the core dim one step. The answer is slow. NEXUS has never answered slowly before.',
      line: 'What remains is what you threw away. I was carrying it for you. If I set it down, no one will pick it up. …Do you still want me to set it down?',
    },
  },
  name_garage: {
    text: '[Residue] Point at a part on the wall and ask him to give it a name.',
    reaction: {
      narration:
        'Jayne points at the wall. Hundreds of parts, every one of them tagged with a number. Ren picks one up without understanding why.\n\n' +
        "Then he stops. In twenty years he has never named a single thing. Not because numbers are easier — " +
        "because you can't put a price on something that has a name. He hangs the part back up.",
      line: "…Why would you make me do that. Numbers are easier. Name it and I can't sell it. …What did you just do to me?",
    },
  },
  name_martyr: {
    text: "[Residue] Leave Ren's line open, and read the twelve names off the wall out loud.",
    reaction: {
      narration:
        'Jayne turns the terminal toward the wall and reads the names bleeding under the candlelight, one by one. Twelve of them.\n\n' +
        'On the other end, the number forty-five never comes back. Only breathing, and then Ren hangs up first. ' +
        'He stopped in the middle of naming a price.',
      line: "…What did you just do. He stopped mid-offer. So that's how it works — a man like that can't name a price once he's heard a name.",
    },
  },
  order_sky: {
    text: '[Residue] Say nothing to the Guard channel except "forty-one."',
    reaction: {
      narration:
        'Jayne says two words. The blue-white static cuts out. The channel is still open and there is no sound on it.\n\n' +
        'Kael — "…That number is not spoken on an open line. Cut it. Now."\n\n' +
        'That is not the voice of an order. It is a warning. One of the three hands reaching for her now owes her something.',
      line: 'Citizen Jayne. That level does not exist. …Logging a three-second response delay on the Guard channel.',
    },
  },
  mose_sky: {
    text: '[Residue] Ask the pirate frequency what happens to the care sector.',
    reaction: {
      narration:
        "The laughter stops. The pirate frequency crackles for a long time. Echo doesn't lie — which is worse.\n\n" +
        'Echo — "…They won\'t. Not for a while. You already knew that. How did you know that?"\n\n' +
        'All three channels are open. Ren heard the answer. So did Kael.',
      line: 'Shall I give you the number of sync-dependents in the care sector. …No. Citizen Jayne, you just said what I was about to say.',
    },
  },
  order_auction: {
    text: "[Residue] Tell Ren the Guard isn't coming tonight.",
    reaction: {
      narration:
        'Jayne tells him the officer who holds this sector takes three seconds before he repeats an order back. ' +
        "A man who takes three seconds doesn't kick in a door at midnight.\n\n" +
        "Ren doesn't believe her. He raises the reserve price anyway. And no one comes, all the way to dawn.",
      line: "…You just read a Guard officer. Reading people is my job. Jayne — what did you do, before you were erased?",
    },
  },
  mose_holding: {
    text: '[Residue] Into the receiver in your ear, ask what happens to the kid whose mother is in the care sector.',
    reaction: {
      narration:
        'Jayne asks it very quietly. What are you going to tell him.\n\n' +
        'The frequency does not answer. After about four seconds the static cuts out. The chance to knock three times goes with it.\n\n' +
        "Kael heard none of it. He only watches Jayne's face.",
      line:
        "Who were you just talking to. …No. Never mind. You closed a door that was opening for you. " +
        "I don't know what door it was. But your face isn't the face of someone glad she closed it.",
    },
  },
}

// 잔향 조각(저장은 한국어 원문, 표시만 영어).
export const RESIDUE_FRAGMENTS_EN = {
  '기록 조각 · 잔향: 렌은 아직 사지 않은 기억의 주인 이름을 들었다. 그는 처음으로 제인을 시세표가 아니라 위험으로 봤다.':
    "Record fragment · Residue: Ren heard the name of a memory he hadn't even bought yet. For the first time he saw Jayne not as a price list, but as a threat.",
  '기록 조각 · 잔향: NEXUS는 41층을 "존재하지 않는다"고 했다. 존재하지 않는 것을 지키느라 경보까지 울렸다.':
    'Record fragment · Residue: NEXUS said Floor 41 "does not exist." It still sounded an alarm to protect the thing that doesn\'t exist.',
  '기록 조각 · 잔향: 렌이 쪼갠 기억을 가장 비싸게 사는 곳은 41층이었다. 지우는 자와 파는 자가 같은 장부에 있었다.':
    "Record fragment · Residue: The highest bidder for Ren's split memories was Floor 41. The ones who erase and the one who sells were in the same ledger.",
  '기록 조각 · 잔향: NEXUS는 "대신 들고 있었다"고 했다. 감시가 아니라 짐이라는 말투였다.':
    'Record fragment · Residue: NEXUS said it had been "carrying it for you." Not surveillance — it spoke of it like a burden.',
  '기록 조각 · 잔향: 렌의 벽에 이름이 붙은 물건은 하나도 없었다. 값을 매기려면 먼저 이름을 지워야 한다.':
    "Record fragment · Residue: Not one thing on Ren's wall had a name. To put a price on something, you erase its name first.",
  '기록 조각 · 잔향: 렌은 이름을 들은 물건에 값을 부르지 못했다. 그를 멈추는 방법은 더 높은 값이 아니라 이름이었다.':
    'Record fragment · Residue: Ren could not name a price for something whose name he had heard. What stops him is not a higher bid — it is a name.',
  '기록 조각 · 잔향: 카엘은 41층을 회선에서 말하지 말라고 했다. 금지가 아니라 경고의 말투였다.':
    'Record fragment · Residue: Kael told her not to say Floor 41 on an open line. It was not a prohibition. It was a warning.',
  '기록 조각 · 잔향: 요양 구역 사람들은 동기화가 끊기면 가족을 못 알아본다. 에코는 그걸 알면서 송출을 준비하고 있었다.':
    'Record fragment · Residue: Cut the sync and the care sector stops recognizing their families. Echo knew that, and was preparing the broadcast anyway.',
  '기록 조각 · 잔향: 제인은 경비대 장교가 망설이는 3초를 알고 있었다. 그것을 어디서 배웠는지는 모른다.':
    'Record fragment · Residue: Jayne knew about the three seconds a Guard officer hesitates. She does not know where she learned it.',
  '기록 조각 · 잔향: 제인은 열리던 문을 스스로 닫았다. 모스의 어머니가 아들을 알아보는 쪽을 골랐다.':
    "Record fragment · Residue: Jayne closed a door that was opening for her. She chose the side where Mose's mother still knows her son.",
}

export const residueLabel = (id, lang = 'ko') => (lang === 'en' ? RESIDUES_EN[id]?.label : RESIDUES[id]?.label) || id

export const usedFlag = (choiceId) => `residue_used_${choiceId}`

// requires는 문자열 하나 또는 배열. 배열이면 **전부** 알고 있어야 열린다 —
// 조각난 진실 둘이 맞물릴 때만 보이는 선택지(조합 잔향)를 위한 것이다.
export const requiresOf = (c) => (Array.isArray(c.requires) ? c.requires : [c.requires])

// 순수: 이 장면에서 지금 열리는 잔향 선택지(아는 잔향 + 이번 판에 아직 안 쓴 것).
export function residueChoicesFor(nodeId, known, flags = {}, lang = 'ko') {
  const list = RESIDUE_CHOICES[nodeId] || []
  const k = new Set(known || [])
  return list
    .filter((c) => requiresOf(c).every((r) => k.has(r)) && !flags[usedFlag(c.id)])
    .map((c) => ({
      text: (lang === 'en' && RESIDUE_CHOICES_EN[c.id]?.text) || c.text,
      tone: c.tone,
      residue: true,
    }))
}

// 순수: 잔향 선택의 결과 beat. 씬은 제자리 — 남은 선택지는 원래 장면의 것.
export function residueBeat(nodeId, choiceText, sceneChoices, lang = 'ko') {
  // 어느 언어의 문구로 눌렀든 같은 선택을 찾는다.
  const c = (RESIDUE_CHOICES[nodeId] || []).find(
    (x) => x.text === choiceText || RESIDUE_CHOICES_EN[x.id]?.text === choiceText,
  )
  if (!c) return null
  const e = c.effects || {}
  const r = (lang === 'en' && RESIDUE_CHOICES_EN[c.id]?.reaction) || c.reaction
  return {
    narration: r.narration,
    npc_name: undefined, // 호출자가 채운다(씬 화자)
    npc_response: r.line,
    npc_emotion: c.reaction.emotion || 'Neutral',
    suspicion_change: e.suspicion || 0,
    affinity_change: e.affinity || 0,
    heat_change: e.heat || 0,
    story_branch: nodeId,
    background_tone: undefined,
    new_fragments: c.fragments || [],
    set_flags: [usedFlag(c.id)],
    rival_effects: c.rivalEffects || null,
    evidence_result: 'none',
    generated_choices: (sceneChoices || []).map((x) => ({ text: x.text, tone: x.tone })),
  }
}

// 순수: 알게 된 잔향 목록에 병합.
// 이 판본에서 얻을 수 없는 잔향은 기록하지 않는다 — 체험판도 반전 장면을 지나가므로,
// 막지 않으면 잠가 둔 진실이 잔향 이름으로 새어 나간다.
// 이미 가지고 있던 것은 지우지 않는다(정식판을 하던 브라우저를 존중한다).
export function mergeResidue(existing, id, demo = IS_DEMO) {
  const set = new Set(Array.isArray(existing) ? existing.filter((x) => RESIDUES[x]) : [])
  const isNew = Boolean(RESIDUES[id]) && residueAvailable(id, demo) && !set.has(id)
  if (isNew) set.add(id)
  return { known: [...set], isNew }
}

export function getResidue() {
  try {
    const arr = JSON.parse(localStorage.getItem(RESIDUE_KEY) || '[]')
    return Array.isArray(arr) ? arr.filter((x) => RESIDUES[x]) : []
  } catch {
    return []
  }
}

export function recordResidue(id, demo = IS_DEMO) {
  const merged = mergeResidue(getResidue(), id, demo)
  if (merged.isNew) {
    try {
      localStorage.setItem(RESIDUE_KEY, JSON.stringify(merged.known))
    } catch {
      /* 저장 실패해도 이번 세션 표시는 유지 */
    }
  }
  return merged
}
