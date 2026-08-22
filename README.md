# AETHERIA 2099 // NEXUS TERMINAL

▶ **플레이: https://aetheria-2099.vercel.app**
(키 없이 오프라인 데모 플레이 · 무료 Gemini 키 입력 시 클라우드 AI · 로컬 자체 모델 구동 시 오프라인 AI)

정화된 지구, 사랑이라는 이름의 돔에 갇힌 인류. 기억 브로커 **제인**이 봉인된 칩 #00의
진실에 다가가는 사이버펑크 **AI 인터랙티브 픽션**. 매 턴 AI가 나레이션·NPC 대사·선택지를
JSON으로 생성하고, NPC별 관계 게이지·NEXUS 추적·증거 제시가 6종 엔딩을 가른다.

- **Stack**: Vite + React + Tailwind + lucide-react
- **하이브리드 AI**: 클라우드(BYOK Gemini) · **로컬 자체 파인튜닝 모델(Ollama)** · 오프라인 스크립트 데모 — 상황에 맞춰 자동 전환
- **운영비 0원**: 웹은 플레이어 키(BYOK), 데스크톱/스팀은 번들한 자체 모델로 오프라인 구동
- **자체 모델 증류 파이프라인**: 큰 교사 모델 → Qwen2.5-7B로 **지식 증류(distillation)** → QLoRA 파인튜닝 → API 없이 로컬 구동

---

## 하이라이트 (포트폴리오 관점)

**① 자체 모델 증류 파이프라인** (`ml/`)
상업 배포엔 BYOK(키 요구)도 서버 호스팅(1인당 과금)도 부적합 → **로컬 모델 번들**이 답.
게임이 클라우드에 보내는 것과 **동일한 입력**으로 교사 모델을 돌려 `(입력→정제 JSON)` 학습쌍을
모으고, 소형 모델을 파인튜닝해 같은 형식을 배우게 한다.
- **교사 선택식**: Gemini(무료) · Claude API · **Claude 서브에이전트 병렬 생성(Workflow)**
- **데이터 품질 설계**: NPC 4종 균형, 증거 hit/miss 케이스, 짧은 1인칭 선택지, 순한글 강제
- **학습**: Qwen2.5-7B-Instruct · QLoRA(4bit) · Unsloth · `train_on_responses_only` · GGUF(q4_k_m)
- **평가 자동화**: 홀드아웃으로 파싱·enum·노드·한국어·선택지 준수율 측정(`eval.mjs`), 모델 간 A/B(`compare-models.mjs`)

**② 하이브리드 프로바이더 라우터** (`services/aiRouter.js`)
우선순위 **BYOK 클라우드 > 로컬 자체모델 > 데모**. 클라우드가 일시적으로 막히면(무료 티어 한도 등)
**로컬 모델로 자동 폴백**해 플레이가 끊기지 않음. **"내 모델 전용" 모드**(키가 있어도 로컬만 —
오프라인/프라이버시)도 지원. 순수 함수로 분리해 유닛 테스트.

**③ AI 출력 3중 방어선**
`responseSchema`(JSON 강제) → `safeParse`(관대한 파싱) → `normalize`(enum 폴백·수치 클램프·
**한자/중국어 문장부호 제거**·선택지 길이컷). 소형 모델의 누출·형식 붕괴를 구조로 방어.

**④ 수미상관 시네마틱** (전부 CSS/Canvas·외부 에셋 0·워터마크 없음)
인트로: NEXUS 기밀 파일 #00 **복호화 → 초록 유출(공식 기록이 거짓)** → 글리치 타이틀.
아웃트로: **세션 종료·봉인 → 결말별 세계 결말** → 엔딩 카드. 한글 코드레인·CRT·글리치로 통일.

**⑤ 엔지니어링 신뢰도**
**vitest 유닛 테스트 52개**(상태머신·엔딩 게이트·출력 방어선·하이브리드 폴백·수집) +
**콘텐츠 그래프 검증기**(BFS 도달성·막다른길·화이트리스트) + CI.

---

## 게임 시스템

| 시스템 | 구현 |
|---|---|
| NPC별 분리 게이지(의심/호감) + trade-off + 임계값 게이팅 | `state.js` |
| NEXUS 추적(전역 감시 시계, 100=드론 급습) | `state.js` `heat` |
| 결정론적 엔딩 게이트(관계·추적·기억이 6종 엔딩 결정) | `scenes.js` `eligibleEndings` |
| 증거 제시 메커닉(hit/miss) | 스키마 + 프롬프트 규칙 |
| 선택의 무게 — 매 턴 게이지 델타·증거 플래시 | `App.jsx` + `StatusPanel` |
| 진행/엔딩 가이드 + 첫 플레이 온보딩 | `App.jsx` + `TutorialOverlay` |
| 결말 수집(크로스-런 갤러리·재플레이 훅) | `collection.js` + `EndingScreen` |
| 3계층 컨텍스트(로어 1회 / 롤링 요약 / 최근 N턴) | `systemInstruction` + `buildContents` |
| 버전드 세이브(웹 ↔ 데스크톱 동일 직렬화) | `SaveGameV1` `serialize/deserialize` |
| 절차적 사운드(감정 바인딩, 파일 0) | `audio/sound.js` |

---

## 프로젝트 구조

```
src/
├─ App.jsx                     # 앱 셸 + 상태 오케스트레이션 + 하이브리드 배선
├─ game/
│  ├─ lore.js / scenes.js      # 로어·씬 바이블(스토리 18 + 엔딩 6)·엔딩 게이트
│  ├─ state.js                 # 상태머신 + SaveGameV1 + 게이팅
│  ├─ collection.js            # 결말 수집(재플레이 훅)
│  └─ offline.js               # 키 없이 도는 스크립트 데모
├─ services/
│  ├─ geminiService.js         # 클라우드 접점 + 스키마/파서/normalize(공용)
│  ├─ ollamaProvider.js        # 로컬 자체 모델 어댑터(동일 시그니처)
│  └─ aiRouter.js              # 하이브리드 라우팅 + 클라우드→로컬 폴백(순수·테스트됨)
├─ components/                 # StatusPanel · MainScreen · Interaction · Intro/Ending · Tutorial · CodeRain …
└─ audio/sound.js              # Web Audio 절차적 사운드

ml/                            # 자체 모델 증류 파이프라인
├─ make-prompts.mjs            # 게임과 동일 입력 프롬프트 생성(NPC 균형·증거 케이스)
├─ generate-dataset.mjs        # 교사(Gemini/Claude) 실행 → 학습쌍 수집(키 로테이션·이어하기)
├─ assemble-dataset.mjs        # 서브에이전트 산출 → normalize → 데이터셋 조립
├─ split-dataset.mjs           # seed 고정 train/eval 분할
├─ finetune_colab.ipynb        # Qwen2.5-7B QLoRA 학습(Colab T4) → GGUF
├─ Modelfile                   # Ollama 등록(SHORT_SYSTEM + 파라미터)
├─ eval.mjs / compare-models.mjs  # 준수율 평가 · 모델 A/B 비교
└─ README.md                   # 파이프라인 상세 가이드

tests/                         # vitest 52개 · scripts/validate-content.mjs 콘텐츠 그래프 검증
```

---

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest 52개
npm run validate # 콘텐츠 그래프 검증
```

- **클라우드 모드**: 우상단 키 아이콘 → 무료 Gemini 키 입력 (https://aistudio.google.com/app/apikey)
- **로컬 자체 모델 모드**: `ollama create aetheria -f ml/Modelfile` 후 실행하면 키 없이 오프라인 AI 구동 (헤더의 CPU 토글 = "내 모델 전용")
- **데모 모드**: 아무것도 없어도 스크립트 데모 플레이

## 배포 (Vercel)

GitHub 푸시 → Vercel Import. Framework: **Vite** 자동 감지. **환경변수 불필요**(키는 각
플레이어 브라우저에만 저장 — 서버/로그/URL로 절대 전송 안 함).

## 데스크톱(Steam·텀블벅) — Electron/Tauri

`vite.config.js`의 `base:'./'` 덕에 빌드 산출물이 `file://`에서도 동작한다. 세이브는
`App.jsx`의 `storage` 객체만 교체(순수 `serialize/deserialize`라 LocalStorage → JSON 파일
이관 즉시). AI는 **번들한 로컬 모델(Ollama)** 로 오프라인·운영비 0 구동.

```bash
npm run build && npx electron-builder   # 배포용 실행 파일
```

---

## 개발 기록

- `DEVLOG.md` — 무엇을·왜·어떻게 막히고 풀었는지 시간순 일지
- `ROADMAP.md` — 심화 로드맵 / `WRITING_GUIDE.md` — 서사 집필 지침 / `ml/README.md` — 증류 파이프라인
