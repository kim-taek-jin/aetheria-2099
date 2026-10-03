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
}
export const RESIDUE_COUNT = Object.keys(RESIDUES).length

// 장면 → 그 장면이 남기는 잔향 id
export const RESIDUE_FROM = Object.fromEntries(Object.entries(RESIDUES).map(([id, r]) => [r.from, id]))

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
}

export const residueLabel = (id, lang = 'ko') => (lang === 'en' ? RESIDUES_EN[id]?.label : RESIDUES[id]?.label) || id

export const usedFlag = (choiceId) => `residue_used_${choiceId}`

// 순수: 이 장면에서 지금 열리는 잔향 선택지(아는 잔향 + 이번 판에 아직 안 쓴 것).
export function residueChoicesFor(nodeId, known, flags = {}, lang = 'ko') {
  const list = RESIDUE_CHOICES[nodeId] || []
  const k = new Set(known || [])
  return list
    .filter((c) => k.has(c.requires) && !flags[usedFlag(c.id)])
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
export function mergeResidue(existing, id) {
  const set = new Set(Array.isArray(existing) ? existing.filter((x) => RESIDUES[x]) : [])
  const isNew = Boolean(RESIDUES[id]) && !set.has(id)
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

export function recordResidue(id) {
  const merged = mergeResidue(getResidue(), id)
  if (merged.isNew) {
    try {
      localStorage.setItem(RESIDUE_KEY, JSON.stringify(merged.known))
    } catch {
      /* 저장 실패해도 이번 세션 표시는 유지 */
    }
  }
  return merged
}
