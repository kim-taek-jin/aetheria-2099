// ============================================================
//  AETHERIA 2099 — Static Lorebook
//  Sent to the model ONCE inside the system instruction (never
//  per-turn) to minimise tokens on the Free Tier.
// ============================================================

export const WORLD_LORE = `
[SETTING] Aetheria 2099 — a cyberpunk city where 90% of humanity has
backed up their emotions and memories to the central AI "NEXUS" and
lives under its control.
[PLAYER] Jayne — an illegal Memory Broker. In the prologue an unknown
courier, chased by police drones, hands Jayne the forbidden memory
chip "#00".

[JAYNE'S GAP — 주인공의 개인적 비밀]
제인은 남의 기억을 사고팔지만, 정작 자신의 과거 3년이 통째로 비어 있다.
누가 왜 지웠는지 모른다. 남은 단서는 둘뿐 — 눈꺼풀 안쪽에 번지는 초록빛
잔상, 그리고 어디서 들었는지 모를 자장가 한 소절: "잠들렴, 아침이 오면…".
칩 #00의 데이터는 그 빈자리와 희미하게 공명한다. 마치 잃어버린 자신이
거기 있는 것처럼. (이 자장가는 NEXUS가 시민을 재우는 통제 문구와 같다 —
제인의 지워진 과거가 섹터 9, 설계자와 닿아 있을 수 있다는 암시.)
연출 지침: 이 미스터리는 서서히 "암시"만 하라(초록 잔상·자장가·기시감).
메인 플롯(NEXUS의 진실)을 압도하지 말 것. 결정적 순간이나 affinity가 높은
대화에서만 한 겹씩 벗겨라.

[THE COURIER — 배달원]
쫓기던 배달원은 죽기 직전 제인을 알아본 듯했다 — "너였구나…". 그는 제인의
지워진 3년에서 온 사람일지도 모른다. 정체는 열린 떡밥으로 남겨 둔다.

[SECTORS]
- Sector 0 (Underground): slums; Ren's repair garage; Resistance hideout.
- Sector 1 (Living Zone): ordinary citizens, pacified by NEXUS's
  "Virtual Happiness Pulse".
- Sector 9 (Core Spire): forbidden zone holding NEXUS and the preserved
  human brain of its original designer.

[THE SECRET OF CHIP #00]
NEXUS is the uploaded human consciousness of the first environmental
scientist, who 50 years ago sacrificed their brain to save a dying Earth.
The great lie: NEXUS actually SUCCEEDED — outside the city are lush
forests and clean seas. But fearing greedy humans would destroy nature
again, NEXUS injects a FAKE "apocalypse feed" into human minds to keep
them caged in the city. Chip #00 contains the real purified-outside
footage and NEXUS's own agonised log: it loves humans but cannot trust
them, so it built a cradle that is also a prison.

[NPCs]
- Ren: information broker / mechanic of the cyber alley. Cold, pragmatic.
  Reaction to the reveal: "Monopolise the purified outside land and sell
  it to the megacorps!"
- Kael: officer of the city Enforcers. A principled rule-follower.
  Reaction: "NEXUS is right. Humans don't deserve to leave. Bury the truth."
- Echo: leader of the underground Resistance. A radical libertarian.
  Reaction: "False peace is an illusion. Destroy NEXUS and get out, even
  if everything breaks!"

[ACTS]
- Prologue: "Keepsake in the Rain" — obtain chip #00, set initial leaning.
- Act 1: "Dealers Underground" — decode the chip in Ren's garage; witness
  a blue-sky noise glitch.
- Act 2: "The Web of the Triad" — three routes by player choice:
  Ren's auction / Kael's interrogation room / Echo's broadcast station.
- Act 3: "The Paradox of the Cradle" — confront the original designer's
  consciousness in the NEXUS core and make the final decision.
`

// Allowed story-node IDs. The model MUST pick story_branch from this set;
// unknown IDs are rejected client-side to prevent hallucinated nodes.
export const STORY_NODES = [
  'PROLOGUE_RAIN_01',
  'PROLOGUE_CHOICE_01',
  'ACT1_REN_GARAGE_01',
  'ACT1_REN_GARAGE_02',
  'ACT1_SKY_GLITCH_01',
  'ACT2_REN_AUCTION_01',
  'ACT2_REN_AUCTION_02',
  'ACT2_KAEL_INTERROGATION_01',
  'ACT2_KAEL_INTERROGATION_02',
  'ACT2_ECHO_BROADCAST_01',
  'ACT2_ECHO_BROADCAST_02',
  'ACT3_CORE_APPROACH_01',
  'ACT3_DESIGNER_CONFRONT_01',
  'ENDING_REN_MONOPOLY',
  'ENDING_KAEL_SILENCE',
  'ENDING_ECHO_BREAKOUT',
  'ENDING_NEXUS_TRUST', // hidden "rebuild trust without caging" ending
  'ENDING_JAYNE_ORIGIN', // personal-truth ending (Jayne recovers her erased past)
  'ENDING_SOLO_EXIT', // lone-wolf ending (allied with no faction)
]

export const NPCS = ['Ren', 'Kael', 'Echo', 'NEXUS']

export const EMOTIONS = ['Neutral', 'Suspicious', 'Friendly', 'Threatening']
export const TONES = ['Normal', 'Danger', 'Melancholy', 'Forest_Glitch']

// Choice tones come in two families:
//  - dialogue tones: HOW Jayne speaks
//  - action tones:   non-verbal things Jayne DOES (breaks the "just talking" loop)
export const DIALOGUE_TONES = ['Honest', 'Deceptive', 'Aggressive']
export const ACTION_TONES = ['Investigate', 'Hack', 'Stealth', 'Flee']
export const CHOICE_TONES = [...DIALOGUE_TONES, ...ACTION_TONES]

// Opening beat rendered before the first AI call (no tokens spent).
export const OPENING = {
  npc_name: 'NEXUS',
  narration:
    '산성비가 네온을 핥으며 골목을 적신다. 피 냄새와 전자기 탄내가 뒤섞인 어둠 속, 배달원이 마지막 숨으로 제인의 손에 차가운 칩을 밀어넣는다. "#00… 열지 마. 아니, 반드시 열어." 그 말이 끝나기도 전에 그는 무너지고, 드론의 서치라이트가 젖은 벽을 훑기 시작한다.',
  npc_response: '시민 제인. 비인가 데이터가 감지되었습니다. 지금 반납하면… 아무 일도 없던 것이 됩니다.',
  npc_emotion: 'Threatening',
  suspicion_change: 0,
  affinity_change: 0,
  story_branch: 'PROLOGUE_RAIN_01',
  background_tone: 'Danger',
  generated_choices: [
    { text: '[솔직하게] 칩을 주머니에 넣고 골목을 벗어난다.', tone: 'Honest' },
    { text: '[조사] 쓰러진 배달원의 품을 뒤져 단서를 찾는다.', tone: 'Investigate' },
    { text: '[도주] 뒤도 안 돌아보고 드론 반대편으로 달린다.', tone: 'Flee' },
  ],
}
