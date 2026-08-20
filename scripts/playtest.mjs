// 자동 플레이테스트 — 여러 전략으로 전 루트를 완주하며 밸런스 지표를 수집한다.
//  각 전략: 새 게임 → 선호 톤으로 선택 반복 → 엔딩/실패까지 → 지표 기록.
//  수집: 턴 수, 도달 엔딩(또는 실패 사유), 최종 게이지, 추적, 최고 의심, 조각 수.
//    node scripts/playtest.mjs   (dev 서버 + ollama 실행 필요)
import { chromium } from 'playwright'
import fs from 'fs'

const URL = process.env.URL || 'http://localhost:5173'
const MAX_TURNS = Number(process.env.MAX_TURNS || 22)
const OUT = process.env.OUT || 'playtest-report.json'

// 톤 라벨(버튼 텍스트) → 전략별 선호 우선순위.
const STRATEGIES = [
  { name: '정직·신뢰', prefer: ['솔직', '조사'] },
  { name: '공격·폭로', prefer: ['도발', '위협', '해킹'] },
  { name: '은신·잠행', prefer: ['은신', '도주'] },
  { name: '거래·실리', prefer: ['기만', '거짓말', '조사'] },
  { name: '무작위', prefer: [] },
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem('aetheria2099.introSeen', '1')
  localStorage.setItem('aetheria2099.tutorialSeen', '1')
  localStorage.setItem('aetheria2099.audio', '0')
})

const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('aetheria2099.save.v1') || '{}'))
const choiceButtons = () => page.locator('button').filter({ hasText: '[' })

async function waitTurn() {
  await page.waitForTimeout(800)
  await page.waitForFunction(() => {
    const s = JSON.parse(localStorage.getItem('aetheria2099.save.v1') || '{}')
    if (s.endingReached || s.failed) return true
    const b = [...document.querySelectorAll('button')].filter((x) => (x.textContent || '').includes('['))
    return b.length >= 3 && b.every((x) => !x.disabled)
  }, { timeout: 120000 })
  await page.waitForTimeout(300)
}

async function playOne(strat, i) {
  // 새 게임
  await page.evaluate(() => {
    localStorage.removeItem('aetheria2099.save.v1')
    localStorage.removeItem('aetheria2099.beat.v1')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  let turns = 0
  let maxHeat = 0
  const nodeSeq = []
  for (; turns < MAX_TURNS; turns++) {
    const s = await readSave()
    maxHeat = Math.max(maxHeat, s.heat || 0)
    if (s.currentNode) nodeSeq.push(s.currentNode)
    if (s.endingReached || s.failed) break
    // 선택
    const btns = choiceButtons()
    const n = await btns.count()
    if (n === 0) break
    const texts = await btns.allTextContents()
    let idx = 0
    for (const p of strat.prefer) {
      const found = texts.findIndex((t) => t.includes(p))
      if (found !== -1) { idx = found; break }
    }
    if (strat.prefer.length === 0) idx = turns % n // 무작위 대용(결정론적 순환)
    try { await btns.nth(idx).click() } catch { break }
    await waitTurn().catch(() => {})
  }
  const s = await readSave()
  const rel = s.relationships || {}
  const maxSus = Math.max(...['Ren', 'Kael', 'Echo'].map((k) => rel[k]?.suspicion ?? 0))
  const maxAff = Math.max(...['Ren', 'Kael', 'Echo'].map((k) => rel[k]?.affinity ?? 0))
  const result = {
    strategy: strat.name,
    turns,
    outcome: s.endingReached || (s.failed ? `FAIL:${s.failed.reason}(${s.failed.npc})` : 'MAX_TURNS'),
    finalNode: s.currentNode,
    maxHeat,
    maxSuspicion: maxSus,
    maxAffinity: maxAff,
    fragments: (s.fragments || []).length,
    heat: s.heat || 0,
    rel: { Ren: rel.Ren, Kael: rel.Kael, Echo: rel.Echo },
    nodes: [...new Set(nodeSeq)],
  }
  console.log(`[${i + 1}/${STRATEGIES.length}] ${strat.name}: ${result.outcome} · ${turns}턴 · heat최대 ${maxHeat} · 의심최대 ${maxSus}`)
  return result
}

const report = []
for (let i = 0; i < STRATEGIES.length; i++) {
  report.push(await playOne(STRATEGIES[i], i))
}
fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
console.log('✅ 리포트 →', OUT)
await browser.close()
