# BGM — Suno 생성 가이드

게임의 감정 톤(`background_tone`) 6종을 **트랙 4종**으로 묶어 크로스페이드한다.
트랙이 없으면 절차적 드론(`src/audio/sound.js`)이 그대로 돌기 때문에, BGM은
**깨지지 않는 선택적 업그레이드**다. 파일을 넣는 순간 자동으로 승격된다.

| 트랙 | 담당 톤 | 역할 |
|---|---|---|
| `calm.mp3` | Neutral, Friendly | 기본 잠복 — 거래·대화·이동 |
| `tension.mp3` | Suspicious | 의심이 조여올 때 |
| `danger.mp3` | Threatening, Forest_Glitch | 추격·드론·NEXUS 압박 |
| `melancholy.mp3` | Melancholy | 기억 조각·상실·엔딩 직전 |

## 넣는 법

1. Suno에서 아래 프롬프트로 생성 (각 트랙 1곡).
2. mp3 다운로드 → `public/music/` 에 위 파일명 그대로 저장.
3. `npm run dev` → 게임에서 사운드 아이콘 ON → 끝. 코드 수정 불필요.

**중요**
- **Instrumental 모드로 생성한다** (보컬이 있으면 나레이션과 충돌).
- 루프 재생되므로 **끝이 갑자기 끊기지 않는** 곡을 고른다. 페이드아웃이 있으면 잘라낸다.
- 2~3분이면 충분. 파일당 3~4MB 이하로 유지 (웹 배포 페이로드).
- 라이선스: Suno 유료 플랜의 상업적 이용 조건을 **스팀 출시 전 반드시 확인**할 것.
  무료 플랜 생성물은 대개 상업적 사용이 불가하다.

## 프롬프트

공통 스타일 앵커: `dark cyberpunk, 2099 neo-Seoul, rain-soaked neon, analog synth, instrumental`

### 1. calm.mp3

```
dark ambient cyberpunk, slow minimal synth pad, deep sub bass pulse,
distant rain and city hum, sparse detuned Rhodes notes, 70 BPM,
patient and unresolved, no drums, no vocals, instrumental, loopable
```

### 2. tension.mp3

```
tense cyberpunk underscore, pulsing muted arpeggio, low string ostinato,
narrow dissonant interval, ticking mechanical percussion, 95 BPM,
creeping paranoia, restrained — never resolves, no vocals, instrumental, loopable
```

### 3. danger.mp3

```
aggressive industrial cyberpunk chase, distorted saw bass, driving
16th-note sequencer, glitch percussion, siren-like synth stabs,
128 BPM, urgent and hostile, dystopian drone surveillance,
no vocals, instrumental, loopable
```

### 4. melancholy.mp3

```
melancholic cyberpunk ambient, lonely piano over warm analog pad,
minor key, tape hiss and vinyl crackle, slow reverb swells, 60 BPM,
memory and loss, bittersweet, no drums, no vocals, instrumental, loopable
```

## 튜닝 포인트

`src/audio/music.js` 상단:

- `VOLUME` (기본 0.42) — 나레이션을 덮으면 낮춘다.
- `FADE` (기본 2.2초) — 씬 전환 크로스페이드 길이.
- `setDroneDuck(0.35)` — BGM 재생 중 절차적 드론이 깔리는 정도.
  드론이 거슬리면 0으로, 질감이 더 필요하면 0.5로.
