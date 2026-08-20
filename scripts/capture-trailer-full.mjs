// 트레일러 종합 캡처 — 게임플레이 영상(실제 타이핑 모션) + 세력·엔딩 스틸.
//  Playwright 컨텍스트 녹화로 AI가 글자를 써 내려가는 실제 모션을 .webm로 담고,
//  세 세력 장면과 엔딩(잭아웃 + 카드)을 고해상 PNG로 캡처한다.
//    node scripts/capture-trailer-full.mjs   (dev 서버 먼저 실행)
import { chromium } from 'playwright'
import fs from 'fs'

const URL = process.env.URL || 'http://localhost:5173'
const OUT = process.env.OUT || 'trailer-assets'
const VID = `${OUT}/video`
const W = 1440, H = 810
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(VID, { recursive: true })

const browser = await chromium.launch()

// ---- 공통 헬퍼 ----
const skipIntro = (page) =>
  page.evaluate(() => {
    localStorage.setItem('aetheria2099.introSeen', '1')
    localStorage.setItem('aetheria2099.tutorialSeen', '1')
    localStorage.setItem('aetheria2099.audio', '0')
  })
const baseSave = (over = {}) => ({
  version: 1, createdAt: null, updatedAt: null,
  relationships: { Ren: { suspicion: 20, affinity: 55 }, Kael: { suspicion: 25, affinity: 40 }, Echo: { suspicion: 20, affinity: 60 }, NEXUS: { suspicion: 0, affinity: 0 } },
  currentNode: 'PROLOGUE_RAIN_01', turnCount: 8, turnsOnNode: 0, heat: 30,
  activeNpc: 'NEXUS', backgroundTone: 'Danger', storySummary: '', recentTurns: [],
  fragments: ['기록 조각: 도시 밖 스카이라인이 초록이었다.', '기억 조각 · 아렌의 인식표', '빈자리 조각 #3'],
  usedFragments: [], flags: {}, endingReached: null, failed: null, ...over,
})
const injectSave = (page, save) =>
  page.evaluate((s) => localStorage.setItem('aetheria2099.save.v1', JSON.stringify(s)), save)

const waitTurn = async (page) => {
  await page.waitForTimeout(1200)
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].filter((x) => (x.textContent || '').includes('['))
    return b.length >= 3 && b.every((x) => !x.disabled)
  }, { timeout: 120000 })
  await page.waitForTimeout(700)
}
const clickChoice = (page, i = 0) => page.locator('button').filter({ hasText: '[' }).nth(i).click()

// ============================================================
//  1) 게임플레이 영상 (실제 타이핑 모션 녹화)
// ============================================================
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: VID, size: { width: W, height: H } } })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await skipIntro(page)
  await page.evaluate(() => localStorage.removeItem('aetheria2099.save.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500) // 오프닝 잠깐 보여주기
  // 두 턴 플레이 — 스트리밍 타이핑이 영상에 담긴다
  await clickChoice(page, 0)
  await waitTurn(page)
  await page.waitForTimeout(1800)
  await clickChoice(page, 0)
  await waitTurn(page)
  await page.waitForTimeout(2000)
  await ctx.close() // 영상 저장(.webm)
  console.log('🎬 게임플레이 영상 저장(.webm)')
}

// 스틸용 컨텍스트
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await skipIntro(page)
let shot = 10
const snap = async (name) => {
  const f = `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: f }); console.log('📸', f)
}

// ============================================================
//  2) 세력별 장면 (각 Act2 노드에서 한 턴 생성)
// ============================================================
const FACTIONS = [
  { npc: 'Ren', node: 'ACT2_REN_AUCTION_01', tone: 'Normal', name: 'ren' },
  { npc: 'Kael', node: 'ACT2_KAEL_INTERROGATION_01', tone: 'Danger', name: 'kael' },
  { npc: 'Echo', node: 'ACT2_ECHO_BROADCAST_01', tone: 'Danger', name: 'echo' },
]
for (const f of FACTIONS) {
  await injectSave(page, baseSave({ currentNode: f.node, activeNpc: f.npc, backgroundTone: f.tone }))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  try { await clickChoice(page, 0); await waitTurn(page) } catch {}
  await snap(`faction-${f.name}`)
}

// ============================================================
//  3) 엔딩 (잭아웃 시퀀스 + 엔딩 카드)
// ============================================================
const ENDINGS = ['ENDING_ECHO_BREAKOUT', 'ENDING_JAYNE_ORIGIN']
for (const e of ENDINGS) {
  await injectSave(page, baseSave({ currentNode: e, endingReached: e, activeNpc: 'NEXUS' }))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(3000) // 잭아웃 터미널 단계
  await snap(`ending-${e}-jackout`)
  await page.waitForTimeout(5500) // 잭아웃 끝 → 엔딩 카드
  await snap(`ending-${e}-card`)
}

await ctx.close()
await browser.close()

// .webm 파일명 정리
const vids = fs.readdirSync(VID).filter((f) => f.endsWith('.webm'))
if (vids.length) {
  fs.renameSync(`${VID}/${vids[0]}`, `${VID}/gameplay.webm`)
  console.log('✅ 영상 →', `${VID}/gameplay.webm`)
}
console.log('✅ 전체 캡처 완료 →', OUT)
