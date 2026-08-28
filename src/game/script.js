// ============================================================
//  script.js — 손으로 쓴 서사(authored spine).
//
//  왜 만드는가: 7B 로컬 모델은 한국어 산문을 못 쓴다. 형식은 지키지만
//  뜻이 통하지 않는 문장이 나오고("판이나올 거면 네 손에 담겨 있어"),
//  무엇보다 **선택이 달라져도 글이 달라지지 않는다** — 그래서 플레이어는
//  게이지가 움직여도 아무것도 안 바뀌었다고 느낀다. 텍스트 어드벤처에서
//  이건 치명적이라, 핵심 장면은 사람이 쓴다.
//
//  AI는 버리지 않는다. 자유 입력처럼 미리 쓸 수 없는 것만 맡는다.
//
//  구조(한 씬 = 한 결정):
//    opening  — 상황을 세우는 나레이션 + NPC의 첫 대사 + 선택지 3개
//    choices[].reaction — 그 선택에만 해당하는 나레이션 + 대사
//    choices[].effects  — 게이지 변화(모델 응답과 같은 필드명이라 그대로 흐른다)
//    choices[].next     — 다음 노드(생략하면 제자리)
//
//  반환 형태는 모델 출력(normalize 결과)과 **동일**하다. 그래서 추적 시계,
//  조각 지급, 루트 확정, 엔딩 게이트 등 기존 시스템이 손대지 않고 그대로 돈다.
// ============================================================

export const SCRIPT = {
  // ---------------- PROLOGUE ----------------
  PROLOGUE_RAIN_01: {
    tone: 'Danger',
    npc: 'NEXUS',
    emotion: 'Threatening',
    narration:
      '산성비가 네온을 녹여 흘린다. 골목 끝에서 배달원이 무릎으로 무너지고, 젖은 콘크리트에 검은 얼룩이 번진다. ' +
      '그가 제인의 손목을 잡는다. 쥐는 힘이 이상하게 세다. 손바닥에 뭔가 딱딱한 것이 밀려 들어온다 — 무광의 칩 하나, 일련번호는 #00.',
    line: '시민 제인. 비인가 데이터 거래가 감지되었습니다. 지금 반납하면 — 아무 일도 없던 것이 됩니다.',
    // NEXUS의 목소리는 머리 안쪽에서 직접 들린다(하늘의 스피커가 아니라).
    choices: [
      {
        text: '[솔직하게] 칩을 주머니에 넣고 골목을 벗어난다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 칩을 안주머니 깊숙이 밀어 넣는다. 손끝에 남은 온기가 남의 것이라는 게 이상하다. ' +
            '서치라이트가 벽을 훑고 지나간 자리마다 빗물이 하얗게 탄다. 제인은 그 빛의 리듬을 세면서, 세 번째 간격에 골목을 빠져나간다.',
          line: '기록되었습니다. 도망은 언제나 자백입니다, 시민 제인.',
          emotion: 'Threatening',
        },
        effects: { heat: 2 },
        next: 'PROLOGUE_CHOICE_01',
      },
      {
        text: '[조사] 쓰러진 배달원의 품을 뒤진다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 무릎을 꿇고 배달원의 옷깃을 젖힌다. 사원증도, 지문도, 홍채 등록도 없다 — 이 도시에 존재한 적 없는 사람이다. ' +
            '그의 눈이 아직 감기지 않았다. 그 눈이 제인의 얼굴에 초점을 맞추고, 입술이 겨우 움직인다. "…너였구나."',
          line: '해당 개체는 등록되지 않았습니다. 시민 제인, 존재하지 않는 것을 뒤지는 이유를 설명하십시오.',
          emotion: 'Suspicious',
        },
        effects: { heat: 4, suspicion: 2 },
        next: 'PROLOGUE_CHOICE_01',
      },
      {
        text: '[도주] 뒤도 안 돌아보고 드론 반대편으로 달린다.',
        tone: 'Flee',
        reaction: {
          narration:
            '제인은 뒤를 보지 않는다. 배달원의 손이 미끄러지듯 떨어지는 감각만 손목에 남는다. ' +
            '골목 세 개를 지나 배수관 뒤에 몸을 접어 넣고 나서야, 자기가 숨을 참고 있었다는 걸 깨닫는다. 칩이 주머니 안에서 한 번, 심장처럼 뛴다.',
          line: '…신호 손실. 시민 제인, 당신은 방금 통계가 되었습니다.',
          emotion: 'Neutral',
        },
        effects: { heat: -2 },
        next: 'PROLOGUE_CHOICE_01',
      },
    ],
  },

  PROLOGUE_CHOICE_01: {
    tone: 'Melancholy',
    npc: 'NEXUS',
    emotion: 'Neutral',
    narration:
      '무너진 지하철 통로. 천장에서 떨어지는 물이 일정한 박자로 웅덩이를 때린다. ' +
      '제인은 칩을 꺼내 단말에 물린다. 화면이 한 줄을 뱉고 멈춘다 — 암호화 층 7. 접근 거부. ' +
      '그리고 칩이 손안에서 다시 뛴다. 이번엔 두 번. 제인의 맥박과 정확히 같은 간격으로.',
    line: '심박이 상승했습니다, 시민 제인. 무엇을 보았습니까?',
    choices: [
      {
        text: '[조사] 그의 마지막 말을 곱씹는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '"너였구나." — 아는 사람을 만난 목소리였다. 반가움도 원망도 아닌, 오래 기다린 것을 확인한 목소리. ' +
            '제인에게는 3년 전이 없다. 그 전의 자기 얼굴도, 이름도, 누구의 딸이었는지도. ' +
            '지워진 자리에 저 남자가 서 있었을까. 물방울이 웅덩이를 때린다. 답은 없다.',
          line: '기억은 재산입니다. 잃어버린 재산은 회수 대상입니다.',
          emotion: 'Suspicious',
        },
        effects: { heat: 1 },
        next: 'ACT1_REN_GARAGE_01',
      },
      {
        text: '[해킹] 암호화 층을 직접 뚫어본다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인은 단말을 칩에 붙이고 우회 루틴을 밀어 넣는다. 1층. 2층. 3층에서 화면이 붉게 뒤집힌다. ' +
            '터널 벽의 낡은 광고판이 동시에 켜졌다 꺼진다 — 제인의 해킹이 도시의 신경을 건드렸다. ' +
            '7층까지는 무리다. 이걸 열 수 있는 손은 섹터 0에 하나뿐이다.',
          line: '침입 시도가 기록되었습니다. 세 번째 경고는 없습니다.',
          emotion: 'Threatening',
        },
        effects: { heat: 6 },
        next: 'ACT1_REN_GARAGE_01',
      },
      {
        text: '[은신] 통로 안쪽으로 더 들어가 숨을 고른다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인은 더 깊은 어둠으로 물러난다. 여기까지는 드론의 전파가 닿지 않는다. ' +
            '벽에 등을 붙이고 앉아 칩을 손바닥 위에 올려둔다. 무광의 검은 표면에 일련번호 하나. #00. ' +
            '누군가 이걸 위해 죽었고, 그 사실을 아는 사람은 이제 이 도시에 제인 하나다.',
          line: '…연결이 불안정합니다. 시민 제인. 어디에 있습니까.',
          emotion: 'Neutral',
        },
        effects: { heat: -4 },
        next: 'ACT1_REN_GARAGE_01',
      },
    ],
  },

  // ---------------- ACT 1 ----------------
  ACT1_REN_GARAGE_01: {
    tone: 'Normal',
    npc: 'Ren',
    emotion: 'Neutral',
    narration:
      '렌의 지하 정비소. 기름 냄새와 홀로 단말의 파란 빛. 벽에는 값이 매겨진 부품들이 번호표를 달고 걸려 있다. ' +
      '렌이 칩을 슬롯에 밀어 넣는다. 단말이 파랗게 깨어난다. 그가 화면을 3초쯤 본다. ' +
      '그리고 아무 말 없이 칩을 빼서 손바닥 위에 올려놓는다. 파란 빛이 그의 손금을 타고 흐른다.',
    line: '제인. 이거 어디서 주웠는지는 안 물어볼게. …근데 값을 못 매기겠다. 그건 둘 중 하나야. 쓰레기거나, 이 도시 전체보다 비싸거나.',
    choices: [
      {
        text: '[솔직하게] 사람이 죽으면서 넘긴 물건이라고 말한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '렌의 손이 멈춘다. 그는 칩을 작업대에 내려놓는다 — 부품을 놓을 때와 다른, 조심스러운 손놀림이다. ' +
            '벽시계가 째깍인다. 그가 처음으로 제인의 눈을 본다.',
          line:
            '…시체가 붙은 물건은 값이 두 배야. 위험 프리미엄. ' +
            '근데 제인, 넌 그걸 알면서도 나한테 말했지. 왜? …아니, 됐어. 열어볼게. 대신 지분 얘기는 나중에 한다.',
          emotion: 'Friendly',
        },
        effects: { affinity: 8, suspicion: -2, heat: 1 },
        next: 'ACT1_REN_GARAGE_02',
      },
      {
        text: '[거짓말] 암시장 폐기물 더미에서 주웠다고 둘러댄다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '렌은 고개를 끄덕인다. 너무 쉽게 끄덕인다. 그리고 작업대 서랍을 열어 스캐너를 꺼내더니, ' +
            '제인이 아니라 칩의 표면을 훑는다. 표면에 마른 피가 얇게 남아 있다.',
          line:
            '폐기물 더미. 그래. …제인, 나는 값을 매기는 사람이야. 값을 매기려면 출처를 알아야 하고. ' +
            '거짓말은 원가에 안 잡히는 비용이거든. 이번엔 내가 떠안을게. 다음엔 네가 떠안아.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 3, suspicion: 6 },
        next: 'ACT1_REN_GARAGE_02',
      },
      {
        text: '[도발] 못 열겠으면 다른 데 가겠다고 말한다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 손을 내밀자 렌은 칩을 주지 않는다. 대신 그것을 손가락 사이에서 한 바퀴 굴린다. ' +
            '단말의 파란 빛이 그의 얼굴 절반을 지운다.',
          line:
            '다른 데. …섹터 0에서 7층 암호를 여는 손은 나 말고 둘 더 있어. ' +
            '하나는 카엘한테 월급을 받고, 하나는 에코한테 목숨을 걸었지. 둘 다 널 열기 전에 네 이름부터 팔 거야. ' +
            '그래도 가겠다면 잡지는 않을게. 나는 붙잡는 데 비용을 안 쓰거든.',
          emotion: 'Threatening',
        },
        effects: { affinity: -2, suspicion: 4, heat: 2 },
        next: 'ACT1_REN_GARAGE_02',
      },
    ],
  },
}

// 이 노드에 손으로 쓴 서사가 있는가.
export const hasScript = (nodeId) => Boolean(SCRIPT[nodeId])

// 씬의 도입부를 모델 출력과 같은 형태의 beat으로 만든다.
export function openingBeat(nodeId) {
  const s = SCRIPT[nodeId]
  if (!s) return null
  return {
    narration: s.narration,
    npc_name: s.npc,
    npc_response: s.line,
    npc_emotion: s.emotion || 'Neutral',
    suspicion_change: 0,
    affinity_change: 0,
    heat_change: 0,
    story_branch: nodeId, // 도입부는 제자리
    background_tone: s.tone || 'Normal',
    new_fragments: [],
    set_flags: [],
    evidence_result: 'none',
    generated_choices: s.choices.map((c) => ({ text: c.text, tone: c.tone })),
  }
}

// 플레이어가 고른 선택의 반응 beat.
//
// 한 클릭 안에 [내 선택의 결과] + [다음 상황]을 모두 담는다. 반응을 별도 턴으로
// 떼면 클릭 수만 늘고 리듬이 죽는다. 다만 반응 대사가 사라지면 "선택이 달라져도
// 글이 안 변한다"는 원래 문제로 되돌아가므로, 넘어갈 때는 반응 대사를 나레이션
// 안에 화자 표기와 함께 남긴다.
const KO_NAME = { Ren: '렌', Kael: '카엘', Echo: '에코', NEXUS: 'NEXUS' }

export function choiceBeat(nodeId, choiceText) {
  const s = SCRIPT[nodeId]
  if (!s) return null
  const c = s.choices.find((x) => x.text === choiceText)
  if (!c) return null

  const nextId = c.next || nodeId
  const advancing = Boolean(SCRIPT[nextId]) && nextId !== nodeId
  const nextScene = advancing ? SCRIPT[nextId] : null
  const e = c.effects || {}

  let narration = c.reaction.narration
  if (advancing) {
    // 이 선택에 대한 상대의 반응을 잃지 않도록 나레이션에 붙여 넣는다.
    if (c.reaction.line) {
      narration += `\n\n${KO_NAME[s.npc] || s.npc} — "${c.reaction.line}"`
    }
    narration += `\n\n${nextScene.narration}`
  }

  return {
    narration,
    npc_name: advancing ? nextScene.npc : s.npc,
    npc_response: advancing ? nextScene.line : c.reaction.line,
    npc_emotion: (advancing ? nextScene.emotion : c.reaction.emotion) || 'Neutral',
    suspicion_change: e.suspicion || 0,
    affinity_change: e.affinity || 0,
    heat_change: e.heat || 0,
    story_branch: nextId,
    background_tone: (advancing ? nextScene.tone : s.tone) || 'Normal',
    new_fragments: c.fragments || [],
    set_flags: c.flags || [],
    evidence_result: 'none',
    generated_choices: (nextScene || s).choices.map((x) => ({ text: x.text, tone: x.tone })),
  }
}
