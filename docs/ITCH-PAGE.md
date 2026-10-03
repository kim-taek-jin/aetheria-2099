# itch.io 페이지 문구

> 업로드 파일: `release/itch/` (git에는 안 올라감 — `npm run build:demo`, `npm run desktop`으로 다시 만든다)
>
> | 파일 | 용도 | itch.io 설정 |
> |---|---|---|
> | `aetheria2099-demo-web.zip` (1.5MB) | 체험판 · 브라우저 플레이 | Kind: **HTML** · "This file will be played in the browser" 체크 · 뷰포트 1280×800, Fullscreen 버튼 켜기 |
> | `aetheria2099-full-mac-arm64.dmg` (119MB) | 정식판 · macOS (Apple Silicon) | Kind: **Downloadable** · 플랫폼 macOS |
>
> 정식판 판매 링크가 생기면 `.env.demo`의 `VITE_STORE_URL`에 넣고 체험판을 다시 빌드한다.
> 그러면 체험판 안의 "정식판 곧 공개"가 "정식판 보기" 버튼으로 바뀐다.

---

## 제목

```
AETHERIA 2099
```

## 짧은 소개 (Short description — 영어가 기본)

```
A cyberpunk text adventure in a domed city where memory is currency. One chip, three factions — and none of them are clean.
```

## 장르 / 태그

- Genre: **Interactive Fiction**
- Tags: `cyberpunk` `interactive-fiction` `text-based` `multiple-endings` `story-rich` `choices-matter` `mystery` `singleplayer` `korean`
- Languages: **English, Korean**

---

## Main description (English — 페이지 본문 위쪽에 둔다)

```
Earth has been purified. Humanity lives under a dome called Love.
The sky is a screen. NEXUS holds your memories for you.

You are Jayne, a memory broker.
On a rainy night, a dying courier presses a chip into your hand.
Serial number #00. A chip no one can put a price on.

And three people want it.

  Ren — a black-market broker who prices everything
  Kael — a Guard investigator who has trusted the rules for twenty years
  Echo — a pirate broadcaster who wants to wake the city up

Whose side will you take? And is that side as clean as you think?
```

### Features

```
◈ A written story, not a generated one
  24 scenes. Every choice gets its own response — the same scene reads
  differently depending on what you picked.

◈ Type freely
  Instead of picking a choice, type what Jayne says or does.
  Ask a question and the character in front of you answers in their own voice —
  over 40 topics, in English or Korean.

◈ Residue — memories from past runs
  Jayne forgot. You remember.
  A truth you uncover on one path opens new choices on your next run.
  The three paths are keys to each other.

◈ Six endings
  One for each faction, one where you walk away alone, and two hidden.

◈ A trace clock and evidence deduction
  Every turn, NEXUS closes in. Present the right memory fragment to hit
  a character's weak point. Present the wrong one and you earn suspicion.
```

### Demo / Full game

```
[DEMO · free · in your browser]
  Play Ren's path from the prologue all the way to an ending.
  Earn one Residue and try it on your next run.

[FULL GAME]
  Kael's path and Echo's path, all three Residues, all six endings.
  Currently available for macOS (Apple Silicon).
```

### Length

```
About 10–15 minutes per run · around an hour to see every path and ending
```

### About AI

```
The story was written in Korean by a person. The English edition was
translated with AI assistance.

Inside the game, AI is used only to understand what you type —
which choice your words match, and what you're asking about.
No key is needed to play from start to finish; without one, free typing
runs on keyword rules and pre-written answers.

Optional: add a Google Gemini API key and free typing understands more,
with characters answering even questions nobody planned for.
The key is stored only in your browser and sent only to Google.
```

### macOS install note (full game)

```
This app is not signed with an Apple developer certificate.
If you see an "unidentified developer" warning on first launch:
  Right-click the app in Finder → Open → Open again
After that it opens normally.
```

---

## 한국어 본문 (영어 아래에 이어서)

```
정화된 지구. 사람들은 사랑이라는 이름의 돔 안에 산다.
하늘은 화면이고, 기억은 NEXUS가 대신 들고 있다.

당신은 기억 브로커 제인.
비 오는 밤, 죽어가는 배달원이 당신 손에 칩 하나를 쥐여준다.
일련번호 #00. 값을 매길 수 없는 칩이다.

그리고 세 사람이 그 칩을 원한다 — 렌, 카엘, 에코.
누구의 편에 설 것인가. 그 편은, 당신이 생각하는 만큼 깨끗한가.

◈ 사람이 쓴 이야기 — 24개 장면, 선택마다 다른 반응
◈ 직접 말하기 — 40개가 넘는 화제에 인물이 자기 목소리로 답한다
◈ 잔향 — 한 길에서 본 진실이 다음 판의 선택지를 연다
◈ 결말 6종 · 추적 시계 · 증거 추리

체험판: 렌의 길을 결말까지(브라우저, 무료)
정식판: 세 길 전부, 잔향 3종, 결말 6종(macOS)

화면 오른쪽 위 버튼으로 한국어/영어를 바꿀 수 있습니다.
```

---

## 등록 전 체크

- [ ] **생성형 AI 표시**: itch.io 업로드 화면의 AI 사용 여부 항목을 정직하게 채운다.
      - **텍스트**: 한국어 본문은 사람이 썼지만 **영어판은 AI가 번역했다** → 텍스트 항목에 표시
      - 인트로 영상·이미지를 AI로 만들었다면 그래픽 항목에도 표시
- [ ] **영어 검수(권장)**: 영어판은 AI 번역이다. 원어민이나 영어 잘하는 지인이 한 번 읽어주면
      좋다. 고칠 곳은 `src/game/script.en.js`(본문), `answers.en.js`(답변), `i18n/ui.js`(화면 문구).
- [ ] **인트로 영상·이미지의 상업적 이용 권리**: 만든 서비스의 약관 확인. 유료 판매 전에 필수.
- [ ] **스크린샷 3~5장**: `docs/blog/img/`의 인트로 컷 + 분기 장면 + 잔향 선택지 + 결말 화면.
- [ ] **표지 이미지**: 630×500 권장. `docs/blog/img/intro-city.png`을 잘라 쓰면 된다.
- [ ] **가격**: 정식판 최소 가격. 지금 분량(24장면·한 판 10~15분·결말 6종)이면
      $2.99~$4.99 구간을 권한다. "원하는 만큼 더 내기" 허용.
- [ ] **언어 표시**: English, Korean. (브라우저가 한국어면 한국어로, 그 밖에는 영어로 시작한다)
- [ ] **Windows 판**: 아직 없음. 요청이 오면 `electron-builder --win`으로 만든다(맥에서는 추가 도구 필요).
