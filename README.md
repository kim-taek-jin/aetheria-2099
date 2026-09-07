# AETHERIA 2099 // NEXUS TERMINAL

정화된 지구, 사랑이라는 이름의 돔에 갇힌 인류. 기억 브로커 **제인**이 봉인된 칩 #00의
진실에 다가가는 한국어 사이버펑크 **인터랙티브 픽션**.
관계 게이지·NEXUS 추적 시계·증거 추리가 6종 엔딩을 가른다.

- **Stack**: Vite + React + Tailwind
- **서사**: 본편 18개 씬은 **사람이 쓴 것**(약 1.9만 자). AI가 대신 쓰지 않는다.
- **자체 모델의 역할**: 자유 입력의 **의도·주제 분류**와, 준비된 화제 밖 질문의 답변 시도
- **모델 없이도 완주 가능**: Ollama도 API 키도 없이 처음부터 결말까지 플레이된다

> **왜 AI가 서사를 안 쓰는가**
> 처음에는 매 턴 모델이 나레이션·대사·선택지를 JSON으로 생성했다. 스키마 준수율은
> 91.8%였지만 문장이 읽히지 않았고, 무엇보다 **선택이 달라져도 글이 달라지지 않았다.**
> 측정으로 확인한 뒤 화자를 사람으로 바꾸고, 모델은 실제로 잘하는 일(분류 — 실측 10/10)로
> 옮겼다. 전체 기록: [docs/blog/01-model-reassignment.md](docs/blog/01-model-reassignment.md)

---

## 실행하기

### 자체 모델과 함께 (권장 · 이 프로젝트의 기본 형태)

```bash
npm install
ollama serve            # 별도 터미널
npm start               # Ollama·모델·추론을 점검한 뒤 실행
```

`npm start`는 실행 전에 소리 내어 점검한다 — Ollama 연결, 모델 등록, **실제 추론 1회**.
하나라도 어긋나면 무엇을 해야 하는지 알려주고, 그래도 게임은 띄운다(모델은 선택 사항이므로).

```
▓ AETHERIA 2099 — 로컬 모델 점검

✓ Ollama 서버 (http://localhost:11434)
✓ 모델 'aetheria' 등록됨
✓ 추론 확인 — 의도 분류 응답 "0" (3896ms)
```

모델이 처음이라면 등록이 필요하다:

```bash
ollama create aetheria -f ml/Modelfile.v3   # fused 디렉터리 필요 — ml/README.md 참고
```

### 모델 없이

```bash
npm install && npm run dev
```

본편은 전부 손으로 쓴 서사라 그대로 완주된다. 자유 입력만 키워드 규칙으로 동작한다.

### 그 밖

```bash
npm test         # 189개 — 서사 정합성·상태머신·분류 폴백·품질 게이트
npm run validate # 씬 그래프 검증(끊긴 링크·enum·도달 불가 노드)
npm run build    # 정적 빌드(dist/, 약 2.4MB)
```

---

## 하이라이트 (포트폴리오 관점)

**① 측정으로 모델의 역할을 정한 것** ⭐
이 프로젝트의 중심 결정. 처음엔 모델이 매 턴 서사를 생성했고 **스키마 준수율 91.8%**를
달성했다. 그런데 재미가 없었다. 파고들어 보니 준수율은 "JSON을 잘 뱉는가"였지
"글이 읽히는가"가 아니었다.

측정으로 갈랐다 — 같은 모델이 **의도 분류는 10/10**, **답변 생성은 게이트 통과 3/8**.
그래서 서사는 사람이 쓰고, 모델은 분류를 맡는다. 전체 기록:
[docs/blog/01-model-reassignment.md](docs/blog/01-model-reassignment.md)

**② 자체 모델 증류 파이프라인** (`ml/`)
Claude를 교사로 `(입력→정제 JSON)` 학습쌍을 모아 Qwen2.5-7B를 QLoRA 파인튜닝.
- **학습**: Qwen2.5-7B-Instruct · QLoRA(4bit) · Unsloth · `train_on_responses_only`
- **이중 양자화 함정**: 4bit 위에서 학습한 걸 다시 양자화하면 손실이 겹친다.
  fp16 병합 후 단일 양자화로 **81% → 88.6%**
- **재학습 실패 2회를 원인까지 규명**: v4 언더핏(90.4% — 데이터↑ 에폭↓),
  v5 과학습(57.5% — 인사말에도 게임 JSON만 뱉음). `ml/README.md`에 처방까지 기록
- **평가 자동화**: 홀드아웃 준수율(`eval.mjs`), 모델 A/B(`compare-models.mjs`)

**③ 모델 오류율 ≠ 체감 오류율** (`ml/measure-resilience.mjs`)
모델 준수율 91.8%가 플레이어에게 어떻게 도달하는지 실측했다.
`normalize`는 전역 폴백이라 구조적으로 실패하지 않고, 깨진 토큰은 재시도로 회수된다 —
**체감 정상률 87.5% → 96.3%**(80샘플, 열화 7건 전부 복구).
결함 종류별로 재시도 온도를 **반대로** 준다: 반복은 올리고(0.85), 깨짐은 내린다(0.45).

**④ 손으로 쓴 서사 + 모델 보조 층** (`game/script.js` `game/answers.js`)
본편 18씬(약 1.9만 자)과 답변 80개(화자 4 × 주제 20)를 사람이 썼다.
자유 입력은 두 갈래 — **묻는 말이면 답하고**(씬 유지), **하는 말이면 장면이 전개된다**.
모델은 어느 쪽인지만 고르고, 화면에 나가는 글은 authoring 된 것을 쓴다.
모델이 없으면 키워드 규칙으로 떨어져 **완주에 지장이 없다**.

**⑤ 클라이언트가 권한을 쥔 게임 규칙**
소형 모델에 맡겼다가 깨진 것들을 하나씩 되찾아온 기록.
- 화자 NPC 강제(모델이 모든 씬을 NEXUS로 귀속 → 세력 엔딩 도달 불가였음)
- 기억 조각 지급(모델 출력 의존 → 5판 82턴에 1개 → 클라이언트 보장으로 판당 7~8개)
- 증거 hit/miss 판정(모델 동전던지기 → 씬의 `evidenceHits`로 확정)
- 루트·결말 선택(모델이 정하던 것 → 플레이어가 고르고 클라이언트가 강제)

**⑥ 엔지니어링 신뢰도**
**vitest 189개** — 상태머신·엔딩 게이트·서사 정합성(끊긴 링크·전 루트 완주 가능성)·
분류 폴백·품질 게이트. **콘텐츠 그래프 검증기**(BFS 도달성·막다른길·enum).
**자동 플레이테스트**(`scripts/playtest.mjs`) — 5개 전략으로 완주해 엔딩 분포·조각 수집률
측정. 도달 불가 엔딩 3종을 여기서 찾아냈다.

---

## 게임 시스템

| 시스템 | 구현 | 권한 |
|---|---|---|
| NPC별 게이지(의심/호감) + trade-off + 임계 게이팅 | `state.js` | 클라이언트 |
| NEXUS 추적 시계(매 턴 +3, 100=드론 급습) | `state.js` `heat` | 클라이언트 |
| 세력 루트 확정(Act2 진입 시 고정) | `state.js` `route` | 클라이언트 |
| 엔딩 게이트(루트·관계·기억이 6종 결정) | `scenes.js` `eligibleEndings` | 클라이언트 |
| 증거 추리(씬의 약점 ↔ 조각 매칭) | `scenes.js` `judgeEvidence` | 클라이언트 |
| 본편 서사(18씬 · 선택별 반응 · 동행별 분기) | `game/script.js` | **사람** |
| 질의응답(화자 4 × 주제 20) | `game/answers.js` | **사람** |
| 자유 입력 의도·주제 판별 | `services/intent.js` | **모델** |
| 준비된 화제 밖 답변(품질 게이트 통과분) | `services/intent.js` | **모델** |
| 3계층 컨텍스트 · 출력 3중 방어선 | `geminiService.js` | 공용 |
| 버전드 세이브(웹 ↔ 데스크톱 동일 직렬화) | `SaveGameV1` | 클라이언트 |
| 절차적 사운드 + BGM 레이어(에셋 선택적) | `audio/` | — |

> 표의 "권한" 열이 이 프로젝트의 요약이다. **모델은 두 칸을 맡는다.**

---

## 프로젝트 구조

```
src/
├─ App.jsx                     # 앱 셸 + 상태 오케스트레이션 + 경로 분기
├─ game/
│  ├─ script.js                # ★ 손으로 쓴 본편 18씬(선택별 반응·동행별 분기)
│  ├─ answers.js               # ★ 질의응답 80개 + 회피 + 증거 반응
│  ├─ scenes.js                # 씬 바이블 · 엔딩 게이트 · 증거 정답
│  ├─ state.js                 # 상태머신 + SaveGameV1 + 게이팅
│  ├─ lore.js / collection.js  # 로어 · 결말 수집
│  └─ offline.js               # (레거시) 스크립트 데모
├─ services/
│  ├─ intent.js                # ★ 의도·주제 분류 + 모델 답변 품질 게이트
│  ├─ geminiService.js         # 스키마 · 파서 · normalize · 깨짐 검출
│  ├─ ollamaProvider.js        # 로컬 자체 모델 어댑터
│  ├─ aiRouter.js              # 하이브리드 라우팅(순수 · 테스트됨)
│  └─ prefetch.js              # 선생성(현재 authoring 씬에서는 미사용)
├─ components/                 # StatusPanel · MainScreen · Interaction · Codex · Intro/Ending
└─ audio/                      # 절차적 사운드 + BGM 크로스페이드

ml/                            # 자체 모델 증류 파이프라인
├─ generate-dataset.mjs        # 교사(Claude) 실행 → 학습쌍 수집
├─ make-conversations.mjs      # 멀티턴 데이터(턴 간 반복의 근본 해결)
├─ finetune_colab.ipynb        # Qwen2.5-7B QLoRA → GGUF
├─ Modelfile.v3                # 현역 모델 등록 정의
├─ eval.mjs                    # 홀드아웃 준수율 평가
├─ measure-resilience.mjs      # 모델 오류율 vs 체감 오류율 실측
└─ README.md                   # 버전 기록표 · 실패 분석 · 다음 처방

scripts/
├─ start-local.mjs             # 자체 모델 점검 후 실행(npm start)
├─ playtest.mjs                # 자동 완주 5전략 — 엔딩 분포·조각 수집률
└─ validate-content.mjs        # 씬 그래프 검증

docs/blog/                     # 제작 기록 연재
tests/                         # vitest 189개
```

---

## 배포

**웹 (Vercel)** — GitHub 푸시 → Import. Framework **Vite** 자동 감지, **환경변수 불필요**.
방문자는 모델 없이 플레이하고, 원하면 자기 Gemini 키를 넣어 자유 입력을 확장한다.
키는 그 사람 브라우저에만 저장되며 **이 게임에는 서버가 없다**.

**데스크톱 (Electron)** — `vite.config.js`의 `base:'./'` 덕에 `file://`에서도 동작한다.
세이브는 `App.jsx`의 `storage` 객체만 교체하면 JSON 파일로 이관된다.

```bash
npm run build && npx electron-builder
```

---

## 개발 기록

이 프로젝트는 **판단의 근거를 남기는 것**을 원칙으로 했다. 커밋 메시지에 무엇을
측정했고 왜 그렇게 정했는지가 들어 있다.

| 문서 | 내용 |
|---|---|
| [docs/blog/](docs/blog/) | 제작 기록 연재 — 1편: 모델 역할 재배치 |
| [`CASE_STUDIES.md`](CASE_STUDIES.md) | 문제 → 가설 → 측정 → 결정 사례 모음 |
| [`docs/ADR.md`](docs/ADR.md) | 아키텍처 결정 기록 |
| [`ml/README.md`](ml/README.md) | 증류 파이프라인 · 모델 버전 기록표 · 실패 분석 |
| [`DEVLOG.md`](DEVLOG.md) | 시간순 일지 |
| [`WRITING_GUIDE.md`](WRITING_GUIDE.md) | 서사 집필 지침 / [`ROADMAP.md`](ROADMAP.md) — 로드맵 |
| [`docs/MUSIC.md`](docs/MUSIC.md) | BGM 트랙 제작 가이드 |

**읽을 거리 하나만 고른다면** — [7B 모델에게 소설을 맡겼다가, 분류기로 강등시킨
이야기](docs/blog/01-model-reassignment.md). 스키마 준수율 91.8%가 왜 "재미"를
대변하지 못했는지, 그걸 어떻게 측정으로 확인하고 아키텍처를 바꿨는지에 대한 기록이다.
