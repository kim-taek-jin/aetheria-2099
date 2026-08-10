# AETHERIA 2099 // NEXUS TERMINAL

▶ **플레이: https://aetheria-2099.vercel.app** (키 없이 오프라인 데모 플레이 가능 · 무료 Gemini 키 입력 시 AI 자유 대화)

AI 기반 인터랙티브 픽션. **운영비 0원** — 플레이어가 자신의 Google AI Studio
Gemini 무료 API Key를 입력하는 **BYOK(Bring Your Own Key)** 방식으로 구동됩니다.

- Stack: **Vite + React + Tailwind + lucide-react**
- AI: **Google Gemini** (`gemini-flash-latest` 롤링 별칭, 무료 티어) — `responseSchema`로 JSON 강제
- Phase 1: Vercel 웹 MVP / Phase 2: Electron·Tauri 데스크톱(Steam·텀블벅) 확장 대비

---

## 1. 프로젝트 구조

```
aetheria-2099/
├─ index.html
├─ vite.config.js          # base:'./' → 웹 + file:// (Electron) 동시 대응
├─ tailwind.config.js
├─ src/
│  ├─ main.jsx / App.jsx    # 앱 셸 + 전체 상태 오케스트레이션
│  ├─ game/
│  │  ├─ lore.js            # 정적 로어북(시스템 인스트럭션 1회 주입) + 노드 목록
│  │  └─ state.js           # 상태머신 + SaveGameV1(버전드 세이브 스키마) + 게이팅
│  ├─ services/
│  │  └─ geminiService.js   # 유일한 API 접점. 스키마 강제/폴백/재시도/비상모드
│  ├─ audio/sound.js        # Web Audio 절차적 사운드(파일 0, 라이선스 0)
│  └─ components/
│     ├─ ApiKeyModal.jsx    # BYOK 모달(형식검증 + 인증 핑)
│     ├─ StatusPanel.jsx    # NPC별 의심도/호감도 게이지 + 배경 톤
│     ├─ MainScreen.jsx     # 타이핑 효과 + 글리치/크로마틱 연출
│     ├─ InteractionPanel.jsx # 동적 선택지 3종 + 자유 입력
│     └─ CodexDrawer.jsx    # 기억 조각 코덱스(Phase 2 갤러리 데이터 겸용)
```

## 2. 반영된 아키텍처 결정 (검수 → 구현)

| 검수 항목 | 구현 위치 |
|---|---|
| NPC별 분리 게이지 + trade-off + 임계값 게이팅 | `state.js` `relationships`, `applyTradeoff`, `GATES` |
| 롤링 요약 자체 갱신(`updated_summary`) | 스키마 필드 + `applyResponse` |
| `responseSchema`로 JSON 강제 + enum 고정 | `geminiService.js` `RESPONSE_SCHEMA` |
| 노드 ID 화이트리스트(할루시네이션 방지) | `lore.js` `STORY_NODES` + `normalize` |
| 수치 이중 클램핑 | 스키마 min/max + `normalize`/`applyResponse` |
| 3단 JSON 파서 폴백 | `safeParse` |
| 비용 방어 "NEXUS 회선 과부하" 비상모드 | `emergencyBeat` + 429/backoff |
| 3계층 컨텍스트(로어=1회 / 요약 / 최근 N턴) | `systemInstruction` + `buildContents` |
| 글리치=진실 누출 연출 | `index.css` `.chroma/.crt`, `MainScreen` |
| 절차적 사운드(감정 바인딩) | `audio/sound.js` |
| 기억 조각 코덱스 | `CodexDrawer.jsx` + `save.fragments` |
| 버전드 세이브(웹↔데스크톱 동일 직렬화) | `SaveGameV1`, `serialize/deserialize` |

## 3. 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 열고, 우상단 🔑 아이콘 → 무료 Gemini 키 입력.
키 발급: https://aistudio.google.com/app/apikey

## 4. Vercel 배포

1. GitHub에 푸시 후 Vercel에서 Import (또는 `npm i -g vercel && vercel`)
2. Framework Preset: **Vite** 자동 감지 · Build: `npm run build` · Output: `dist`
3. **환경변수 불필요** — 키는 서버가 아니라 각 플레이어 브라우저에 저장됩니다.

> 보안 메모: BYOK는 설계상 키가 클라이언트에 존재합니다. 서버로 절대 전송하지
> 않으며, 로그/URL 쿼리에 담지 않습니다(코드에서 준수). 상용화 시 서버 프록시가
> 필요하면 `geminiService.js` 한 파일만 프록시 fetch로 교체하면 됩니다.

## 5. Phase 2 — Electron 데스크톱 패키징 가이드

`vite.config.js`의 `base:'./'` 덕분에 빌드 산출물이 `file://`에서도 동작합니다.

```bash
npm i -D electron electron-builder
```

`electron/main.cjs`:
```js
const { app, BrowserWindow } = require('electron')
const path = require('path')
function createWindow() {
  const win = new BrowserWindow({ width: 1100, height: 800, backgroundColor: '#05070d' })
  win.loadFile(path.join(__dirname, '../dist/index.html'))
}
app.whenReady().then(createWindow)
```

세이브 전환: `src/App.jsx`의 `storage` 객체만 교체하면 됩니다. `serialize/
deserialize`는 이미 순수 함수라 LocalStorage → JSON 파일로 그대로 이관됩니다.

```js
// Electron preload가 노출한 fs 브릿지 예시
loadSave: () => deserialize(window.saveApi.readFile()),
writeSave: (s) => window.saveApi.writeFile(serialize(s)),
```

빌드:
```bash
npm run build            # dist/ 생성
npx electron-builder      # Steam/텀블벅 배포용 실행 파일
```

Tauri를 쓸 경우에도 동일하게 `dist/`를 프론트로 지정하고 `storage`만 Rust
`fs` 커맨드로 바꾸면 됩니다.
