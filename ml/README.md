# 🧠 Aetheria 2099 — 자체 모델 파이프라인 (증류 → 파인튜닝 → 서빙)

Gemini를 **증류(distillation)** 해 작은 로컬 모델(Qwen2.5-3B)로 파인튜닝한다.
목적: **스팀/데스크톱 빌드에서 API·키 없이, 오프라인·운영비 0으로 구동.**
(웹 라이브는 BYOK/데모 유지 — 3B는 Vercel/브라우저에서 못 돌림.)

```
Gemini(교사) → 데이터셋 생성 → Colab QLoRA 파인튜닝 → 평가 → GGUF → Ollama 번들
```

> ⚠️ 현실 눈높이: 잘 튜닝해도 3B는 Gemini-flash보다 품질↓. 목표는 "Gemini급"이
> 아니라 **"내 모델로 플레이 가능 + 스팀 고객 PC에서 구동"**. 작을수록 고객 범위↑.

---

## 1단계 — 데이터셋 생성 (증류) · `generate-dataset.mjs`

게임이 교사 모델에 보내는 것과 **동일한 입력**으로 교사를 돌려, `(system, user,
assistant=정제 JSON)` 쌍을 JSONL로 모은다. 학습 최적화를 위해 레코드의 system은
**짧게** 저장한다(상세 규칙은 가중치로 학습). 교사에는 전체 규칙 프롬프트를 쓴다.

교사는 `PROVIDER`로 선택:

```bash
# ① Claude (유료·빠름·rate limit 여유). 약 $2 크레딧 → Haiku 4.5로 ~500개.
PROVIDER=claude ANTHROPIC_API_KEY=sk-ant-... TARGET=500 node ml/generate-dataset.mjs

# ② Gemini 무료 (느림·일일 한도, 대신 공짜로 대량)
PROVIDER=gemini GEMINI_API_KEY=AIza... TARGET=500 node ml/generate-dataset.mjs
```

- **Claude 비용 감각**(교사 = `CLAUDE_MODEL`, 기본 `claude-haiku-4-5`): 매 호출
  동일한 전체 systemInstruction을 **프롬프트 캐싱**으로 ~90% 깎아 예제당 ≈$0.0035
  → **$2 ≈ 500개**. Sonnet/Opus로 올리면 각각 ~180/~110개로 급감하니 파일럿은 Haiku.
- **양 vs 품질**: 증류는 교사 품질보다 **데이터 양**이 학생을 더 키운다. Claude로
  빠르게 500개 파일럿 → 학습/평가 베이스라인 확인 → 필요하면 Gemini 무료로 증량.
  두 교사 모두 **같은 SHORT_SYSTEM 레코드**를 뱉으므로 섞어도 된다(같은 파일에 append).
- **이어하기/한도**: rate limit·일일 한도에 걸리면 대기 후, 다시 실행하면
  목표까지 **이어서** 채운다(append/resume).
- **권장 규모**: 첫 실험 300~500 → 품질 보고 1000~3000으로 확대.
- 출력: `ml/dataset.jsonl` (git에는 안 올림 — 크고 재생성 가능).

## 2단계 — Colab 파인튜닝 · `finetune_colab.py`

Colab 새 노트북 → **런타임 유형: T4 GPU** → 파일의 `# %%` 블록을 셀로 순서 실행.

- 모델: **Qwen2.5-3B-Instruct** (소형 중 한국어+JSON 최강급)
- 기법: **QLoRA(4bit)** + **Unsloth**(T4에서 빠름), assistant JSON만 손실 계산.
- 산출: LoRA 어댑터 → **GGUF(q4_k_m)** 로 내보내 다운로드.

## 3단계 — 평가 (다음 작업)

`ml/eval.mjs`(예정): 홀드아웃 예제로 **JSON 파싱 성공률 / 스키마·enum 준수 /
노드 유효성 / 한국어 전용 / 톤 일치** 를 측정해 Gemini·베이스와 비교.

## 4단계 — 서빙 & 게임 연결 (다음 작업)

1. GGUF를 Ollama에 등록: `ollama create aetheria -f Modelfile`
2. `src/services/` 에 **프로바이더 어댑터**(`ollamaProvider.js`) 추가 —
   `generateBeat`와 같은 시그니처로, `localhost:11434`에 요청.
3. 키 없으면 Ollama 사용하도록 분기(데스크톱 빌드). 웹은 기존대로.

---

## 개념 메모 (배우면서)
- **증류**: 큰 교사 모델의 (입력→출력)을 작은 학생이 모방 학습. 데이터 품질이 전부.
- **QLoRA**: 4bit 양자화 + 작은 LoRA 어댑터만 학습 → 소형 GPU에서 대형 모델 튜닝.
- **train_on_responses_only**: 프롬프트는 손실에서 빼고 정답(JSON)만 학습 → 효율↑.
- **왜 짧은 system**: 규칙을 가중치에 새기면 추론 시 컨텍스트↓·속도↑.
