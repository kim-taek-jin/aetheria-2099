// ============================================================
//  오프라인 데모 모드 — 키 없이 즐기는 스크립트 맛보기.
//
//  각 비트는 AI 출력과 "완전히 같은 형태"의 데이터라, 기존 렌더링
//  파이프라인(타이핑·글리치·게이지·코덱스)을 그대로 재사용한다.
//  선택지의 next = 다음 데모 비트 인덱스(작은 분기 포함).
//  wall:true = 유료(AI) 전환 유도 / restart:true = 처음부터.
//
//  구성: 프롤로그 → 렌 정비소 → 초록 글리치 → 에코 방송국(증거 쇼다운)
//        → 벽(키 전환). 증거 심문의 페이오프까지 키 없이 체험시킨다.
// ============================================================

export const DEMO_BEATS = [
  // 0 — 골목 탈출 (Prologue) : 나레이션 + NEXUS + 빈자리 조각 #1
  {
    narration:
      '드론의 굉음이 골목 저편으로 멀어진다. 손안의 칩이 심장처럼 미약하게 떨린다. 쓰러진 배달원의 마지막 말이 귓가에 맴돈다 — "너였구나…". 제인은 그를 모른다. 그런데 왜, 목이 메는가.',
    npc_name: 'NEXUS',
    npc_response: '시민 제인. 당신의 심박이 불안정합니다. 진정하세요… 곧, 아무 일도 없던 것이 됩니다.',
    npc_emotion: 'Suspicious',
    suspicion_change: 0,
    affinity_change: 0,
    story_branch: 'PROLOGUE_CHOICE_01',
    background_tone: 'Danger',
    new_fragments: ['기억 조각 · 빈자리 #1: 그는 나를 알았다. 나는 그를 모른다. 내 지워진 3년 속의 얼굴일까.'],
    evidence_result: 'none',
    heat_change: 3,
    generated_choices: [
      { text: '[솔직하게] 이 칩을 해독할 사람은 렌뿐이다. 정비소로 향한다.', tone: 'Honest', next: 1 },
      { text: '[조사] 배달원이 남긴 흔적이 더 없는지 골목을 살핀다.', tone: 'Investigate', next: 1 },
      { text: '[은신] 드론이 완전히 사라질 때까지 그림자 속에 숨는다.', tone: 'Stealth', next: 1 },
    ],
  },

  // 1 — 렌의 정비소 (Act 1) : 렌의 목소리 시연
  {
    narration: '기름 냄새와 파란 홀로 단말의 빛. 렌이 슬롯에 칩을 꽂자, 화면이 붉게 깜빡이며 경고를 토한다.',
    npc_name: 'Ren',
    npc_response: '공짜는 없어, 넌 뭘 담보로 걸 건데? 이런 물건은… 값도 위험도 남달라. 정보도 돈이야, 값을 치뤄야지.',
    npc_emotion: 'Neutral',
    suspicion_change: 3,
    affinity_change: 2,
    story_branch: 'ACT1_REN_GARAGE_01',
    background_tone: 'Normal',
    new_fragments: [],
    set_flags: ['met_ren', 'chip00_decoding'],
    evidence_result: 'none',
    heat_change: 2,
    generated_choices: [
      { text: '[솔직하게] 칩의 출처를 있는 그대로 털어놓는다.', tone: 'Honest', next: 2 },
      { text: '[거짓말] 흔한 밀수품인 척 값을 깎으려 든다.', tone: 'Deceptive', next: 2 },
      { text: '[해킹] 렌의 단말에 몰래 접속해 해독을 훔쳐본다.', tone: 'Hack', next: 2 },
    ],
  },

  // 2 — 초록 하늘의 노이즈 (Act 1) : 글리치 + 진실 조각 + 빈자리 #2
  {
    narration:
      '해독이 완료되는 순간, 모니터가 찢어진다. 가짜 멸망 영상 사이로 — 우거진 숲, 푸른 하늘 한 프레임이 새어 나온다. 제인의 눈꺼풀 안쪽 잔상과, 그것이 정확히 겹친다. 렌이 마른침을 삼킨다. "이건… 나 혼자 감당할 물건이 아냐. 지하 방송국의 에코한테 가져가 — 걘 이걸 터뜨리고 싶어 안달일 테니. 주소는 해독 값으로 쳐줄게."',
    npc_name: 'NEXUS',
    npc_response: '보지 마. …제발, 그것만은 보지 말아 줘.',
    npc_emotion: 'Threatening',
    suspicion_change: 0,
    affinity_change: 0,
    story_branch: 'ACT1_SKY_GLITCH_01',
    background_tone: 'Forest_Glitch',
    new_fragments: [
      '기록 조각: 도시 밖 스카이라인이 회색이 아니었다. 잠깐이지만 — 초록이었다.',
      '기억 조각 · 빈자리 #2: 이 초록을 나는 전에 본 적 있다. 잊기 전의 내가, 저 밖에 있었나?',
    ],
    set_flags: ['saw_green_sky_truth', 'ren_pointed_to_echo'],
    evidence_result: 'none',
    heat_change: 5,
    generated_choices: [
      { text: '[조사] 글리치 프레임을 붙잡아 증거로 저장한다.', tone: 'Investigate', next: 3 },
      { text: '[솔직하게] 렌의 말대로 이 진실을 에코의 방송국으로 가져간다.', tone: 'Honest', next: 3 },
      { text: '[은신] 추적당하지 않도록 접속 로그를 지우고 방송국으로 향한다.', tone: 'Stealth', next: 3 },
    ],
  },

  // 3 — 에코의 방송국 (Act 2) : 대치 + 증거/위협 분기
  {
    narration:
      '점거된 지하 해적 방송국. 낡은 송출탑이 지직거리고, 벽엔 반군의 낙서가 번진다. 에코가 도시 전역 송출 버튼 위에 손을 얹은 채 제인을 노려본다.',
    npc_name: 'Echo',
    npc_response:
      '렌이 보낸 정보상이라고? 그 장사꾼이 웬일로 공짜 물건을 흘렸을까. 한 발만 잘못 디디면 — 넌 여기서 살아 못 나가.',
    npc_emotion: 'Suspicious',
    suspicion_change: 4,
    affinity_change: 0,
    story_branch: 'ACT2_ECHO_BROADCAST_01',
    background_tone: 'Danger',
    new_fragments: [],
    set_flags: ['met_echo'],
    evidence_result: 'none',
    heat_change: 4,
    generated_choices: [
      { text: '[증거] 방금 붙잡은 초록 하늘의 조각을 에코에게 들이댄다.', tone: 'Investigate', next: 4 },
      { text: '[솔직하게] 바깥은 죽지 않았다고, 진실을 차분히 설득한다.', tone: 'Honest', next: 4 },
      { text: '[위협/도발] 당장 송출 버튼에서 손을 떼라고 다그친다.', tone: 'Aggressive', next: 5 },
    ],
  },

  // 4 — 증거가 통한다 (evidence HIT) : 시그니처 페이오프
  {
    narration: '제인이 조각을 들이대자, 에코의 눈이 번뜩인다. 송출 버튼을 향하던 손이 공중에서 멈춘다.',
    npc_name: 'Echo',
    npc_response: '이것 봐! 내가 틀리지 않았어! 넥서스는 우릴 속이고 있었던 거야. 바깥 세상은 죽지 않았어 — 살아있어!',
    npc_emotion: 'Friendly',
    suspicion_change: -4,
    affinity_change: 10,
    story_branch: 'ACT2_ECHO_BROADCAST_02',
    background_tone: 'Forest_Glitch',
    updated_summary:
      '제인은 배달원에게서 칩 #00을 받아 렌의 정비소에서 해독했다. 도시 밖이 정화되어 살아있다는 진실을 목격하고, 렌의 안내로 에코의 방송국을 찾았다. 초록 하늘의 증거를 들이대자 에코는 진실을 확신하며 제인의 편이 되었다.',
    new_fragments: ['기록 조각: 에코의 자유에는 언제나 누군가의 이름표가 붙은 잔해가 따랐다.'],
    set_flags: ['evidence_shown_echo', 'echo_believes_truth'],
    evidence_result: 'hit',
    heat_change: 6,
    generated_choices: [
      { text: '[솔직하게] 함께 코어 스파이어로 가자고 제안한다.', tone: 'Honest', next: 6 },
      { text: '[해킹] 송출 범위를 좁혀 시민 피해를 줄일 방법을 찾는다.', tone: 'Hack', next: 6 },
    ],
  },

  // 5 — 몰아붙임의 대가 (aggressive) : 위험 고조 후 회복 가능
  {
    narration:
      '제인의 위협에 방송국 공기가 얼어붙는다. 반군들이 총구를 들고, 밖에서는 카엘의 진압 신호가 점점 가까워진다.',
    npc_name: 'Echo',
    npc_response: '지금… 날 협박한 거야? 배신자의 끝이 어떤지, 보여줄까.',
    npc_emotion: 'Threatening',
    suspicion_change: 10,
    affinity_change: -3,
    story_branch: 'ACT2_ECHO_BROADCAST_01',
    background_tone: 'Danger',
    new_fragments: [],
    evidence_result: 'none',
    heat_change: 10,
    generated_choices: [
      { text: '[증거] 오해였다며 초록 조각을 꺼내 진심을 증명한다.', tone: 'Investigate', next: 4 },
      { text: '[은신] 진압 부대가 들이닥치기 전에 조용히 몸을 뺀다.', tone: 'Stealth', next: 4 },
    ],
  },

  // 6 — 벽(Wall) : 유료(AI) 모드 전환 유도
  {
    narration:
      '에코는 이제 제인을 믿는다 — 위험할 만큼 뜨겁게. 남은 건 코어 스파이어, 그리고 요람의 설계자와의 대면. 그 끝에서 제인은 자신의 지워진 3년마저 마주하게 될 것이다.',
    npc_name: 'NEXUS',
    npc_response:
      '▓▒░ 오프라인 맛보기는 여기까지다. 접속 키를 연결하면 — 에코의 폭주도, 카엘의 추격도, 네가 누구였는지도, 이 지점부터 살아 움직인다. ░▒▓',
    npc_emotion: 'Neutral',
    suspicion_change: 0,
    affinity_change: 0,
    story_branch: 'ACT2_ECHO_BROADCAST_02',
    background_tone: 'Melancholy',
    new_fragments: [],
    evidence_result: 'none',
    heat_change: 0,
    generated_choices: [
      { text: '🔑 접속 키를 연결하고 자유 플레이 시작', tone: 'Honest', wall: true },
      { text: '↺ 맛보기를 처음부터 다시 본다', tone: 'Investigate', restart: true },
    ],
  },
]

// 데모 진행: 현재 선택지(choice)로 다음 비트를 고른다.
// choice.wall / choice.restart 는 App에서 특수 처리.
export function nextDemoBeat(choice, currentIndex) {
  if (!choice) return DEMO_BEATS[0]
  const idx = typeof choice.next === 'number' ? choice.next : currentIndex + 1
  return DEMO_BEATS[idx] || DEMO_BEATS[DEMO_BEATS.length - 1]
}
