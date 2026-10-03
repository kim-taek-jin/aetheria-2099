// ============================================================
//  start-local.mjs — 자체 모델과 함께 게임을 띄운다(포트폴리오 기본 실행).
//
//  이 프로젝트의 기본 형태는 "내 맥에서 내 모델로 도는 것"이다.
//  그런데 Ollama가 꺼져 있거나 모델이 등록 안 돼 있으면 게임은 조용히
//  손으로 쓴 서사만 쓰고 넘어간다 — 동작은 하지만 자체 모델은 안 도는,
//  알아채기 어려운 상태가 된다.
//
//  그래서 실행 전에 소리 내어 점검한다: Ollama → 모델 → 실제 추론 1회.
//  하나라도 어긋나면 정확히 무엇을 해야 하는지 알려준다.
// ============================================================

import { spawn } from 'node:child_process'

const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'aetheria'

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

async function check() {
  // 1) Ollama 서버
  let tags
  try {
    const r = await fetch(`${OLLAMA}/api/tags`)
    if (!r.ok) throw new Error(String(r.status))
    tags = await r.json()
    console.log(ok(`Ollama 서버 (${OLLAMA})`))
  } catch {
    console.log(bad(`Ollama 서버에 연결할 수 없습니다 (${OLLAMA})`))
    console.log(dim('   → 터미널에서:  ollama serve'))
    console.log(dim('   → 설치 안 했다면:  https://ollama.com/download'))
    return false
  }

  // 2) 모델 등록
  const names = (tags.models || []).map((m) => m.name)
  if (!names.some((n) => n.startsWith(MODEL))) {
    console.log(bad(`모델 '${MODEL}'이 등록되어 있지 않습니다`))
    console.log(dim(`   등록된 것: ${names.join(', ') || '(없음)'}`))
    console.log(dim(`   → 등록:  ollama create ${MODEL} -f ml/Modelfile.v3`))
    console.log(dim('   → (fused 디렉터리가 필요합니다. ml/README.md 참고)'))
    return false
  }
  console.log(ok(`모델 '${MODEL}' 등록됨`))

  // 3) 실제 추론 — 등록만 되고 안 도는 경우가 있어서 한 번 찔러본다.
  //    이 게임에서 모델의 주 역할이 분류이므로 분류로 확인한다.
  const t0 = Date.now()
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: '다음 중 "솔직하게 털어놓는다"와 의도가 같은 번호는? 0: 솔직 1: 거짓말 2: 도발\n번호:',
        stream: false,
        options: { temperature: 0, num_predict: 5 },
      }),
    })
    const raw = ((await r.json())?.response || '').trim()
    const ms = Date.now() - t0
    if (!/\d/.test(raw)) throw new Error('숫자 응답 없음')
    console.log(ok(`추론 확인 — 의도 분류 응답 "${raw.match(/\d/)[0]}" (${ms}ms)`))
  } catch (e) {
    console.log(bad(`모델이 응답하지 않습니다: ${e.message}`))
    console.log(dim('   → 첫 호출은 모델 적재로 오래 걸릴 수 있습니다. 다시 시도해보세요.'))
    return false
  }

  return true
}

console.log('\n\x1b[36m▓ AETHERIA 2099 — 로컬 모델 점검\x1b[0m\n')
const healthy = await check()

console.log()
if (healthy) {
  console.log('\x1b[32m자체 모델과 함께 실행합니다.\x1b[0m')
  console.log(dim('  · 본편 24씬은 손으로 쓴 서사 — 모델 없이도 완주됩니다'))
  console.log(dim('  · 모델은 자유 입력의 의도·주제 판별과 준비된 화제 밖 답변을 맡습니다\n'))
} else {
  console.log('\x1b[33m자체 모델 없이 실행합니다.\x1b[0m')
  console.log(dim('  본편은 전부 손으로 쓴 서사라 처음부터 결말까지 플레이할 수 있습니다.'))
  console.log(dim('  자유 입력만 키워드 규칙으로 동작합니다.\n'))
}

// 점검 결과와 무관하게 게임은 띄운다 — 모델은 선택 사항이지 전제 조건이 아니다.
spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: false })
