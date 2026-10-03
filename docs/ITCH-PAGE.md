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

## 짧은 소개 (Short description, 한 줄)

```
기억이 화폐가 된 돔 도시. 칩 하나를 두고 세 세력 사이에서 고르는 한국어 사이버펑크 텍스트 어드벤처.
```

## 장르 / 태그

- Genre: **Interactive Fiction**
- Tags: `cyberpunk` `interactive-fiction` `text-based` `visual-novel` `multiple-endings` `korean` `story-rich` `choices-matter` `mystery` `singleplayer`

---

## 본문

```
정화된 지구. 사람들은 사랑이라는 이름의 돔 안에 산다.
하늘은 화면이고, 기억은 NEXUS가 대신 들고 있다.

당신은 기억 브로커 제인.
비 오는 밤, 죽어가는 배달원이 당신 손에 칩 하나를 쥐여준다.
일련번호 #00. 값을 매길 수 없는 칩이다.

그리고 세 사람이 그 칩을 원한다.

  렌 — 모든 것에 값을 매기는 암시장 브로커
  카엘 — 20년 동안 규정을 믿어온 보안국 수사관
  에코 — 도시를 깨우려는 방송 해커

누구의 편에 설 것인가. 그 편은, 당신이 생각하는 만큼 깨끗한가.
```

### 특징

```
◈ 사람이 쓴 이야기
  24개 장면, 약 2만 자. 모든 선택에 그 선택만의 반응이 있습니다.
  같은 장면도 무엇을 골랐느냐에 따라 다른 글이 나옵니다.

◈ 직접 말하기
  선택지를 고르는 대신 제인의 말을 직접 타이핑할 수 있습니다.
  질문하면 인물이 자기 입장에서 대답합니다.

◈ 잔향 — 지난 판의 기억
  제인은 기억을 잃었지만, 당신은 지난 판을 기억합니다.
  한 길에서 알게 된 진실이 다음 판에서 새로운 선택지를 엽니다.
  세 길이 서로의 열쇠입니다.

◈ 6개의 결말
  세 세력의 결말, 홀로 떠나는 결말, 그리고 숨겨진 두 개.

◈ 추적 시계와 증거 추리
  매 턴 NEXUS의 추적이 다가옵니다. 모은 기억 조각을 증거로 들이밀어
  인물의 약점을 찌르세요. 틀린 증거는 의심을 삽니다.
```

### 체험판 / 정식판

```
[체험판 · 무료 · 브라우저]
  프롤로그부터 결말까지, 렌의 길 하나를 끝까지 플레이할 수 있습니다.
  잔향 하나를 얻고, 다음 판에서 직접 써볼 수 있습니다.

[정식판]
  카엘의 길과 에코의 길, 잔향 3종 전부, 결말 6종 전부.
  현재 macOS(Apple Silicon)용으로 제공됩니다.
```

### 플레이 시간

```
한 판 약 10~15분 · 세 길과 결말을 모두 보려면 약 1시간
```

### AI에 대해

```
이 게임의 이야기는 사람이 썼습니다.

AI는 직접 타이핑한 말을 이해하는 데만 쓰입니다 —
"이 말이 어떤 선택에 해당하는가", "무엇에 대해 묻는가"를 판단합니다.
키가 없어도 처음부터 결말까지 플레이할 수 있고,
그때 자유 입력은 키워드 규칙으로 동작합니다.

선택 사항: Google Gemini API 키를 넣으면 자유 입력이 더 넓게 이해되고,
준비되지 않은 질문에도 인물이 그 자리에서 답합니다.
키는 당신의 브라우저에만 저장되고, Google에만 전송됩니다.
```

### macOS 설치 안내 (정식판)

```
이 앱은 Apple 개발자 서명이 되어 있지 않습니다.
처음 실행할 때 "확인되지 않은 개발자" 경고가 뜨면:
  Finder에서 앱을 우클릭 → [열기] → 다시 [열기]
한 번 열고 나면 다음부터는 그냥 실행됩니다.
```

---

## English (short)

```
A Korean cyberpunk text adventure in a domed city where memory is currency.
You are Jayne, a memory broker holding chip #00 — and three factions want it.

- Hand-written story: 24 scenes, every choice gets its own response
- Type your own lines; characters answer from their own point of view
- Residue: Jayne forgot, but you remember. Truths from one route unlock new choices in the next run
- 6 endings, a NEXUS trace clock, and evidence-based deduction

Korean language only. Free demo (Ren's route, start to finish) playable in the browser.
```

---

## 등록 전 체크

- [ ] **생성형 AI 표시**: itch.io 업로드 화면의 AI 사용 여부 항목을 정직하게 채운다.
      인트로 영상·이미지를 AI로 만들었다면 해당 항목에 표시한다. (본문은 사람이 썼다)
- [ ] **인트로 영상·이미지의 상업적 이용 권리**: 만든 서비스의 약관 확인. 유료 판매 전에 필수.
- [ ] **스크린샷 3~5장**: `docs/blog/img/`의 인트로 컷 + 분기 장면 + 잔향 선택지 + 결말 화면.
- [ ] **표지 이미지**: 630×500 권장. `docs/blog/img/intro-city.png`을 잘라 쓰면 된다.
- [ ] **가격**: 정식판 최소 가격. 지금 분량(24장면·한 판 10~15분·결말 6종)이면
      $2.99~$4.99 구간을 권한다. "원하는 만큼 더 내기" 허용.
- [ ] **언어 표시**: Korean.
- [ ] **Windows 판**: 아직 없음. 요청이 오면 `electron-builder --win`으로 만든다(맥에서는 추가 도구 필요).
