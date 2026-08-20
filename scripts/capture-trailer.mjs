// 트레일러용 실제 플레이 화면 캡처 (Playwright 헤드리스).
//  dev 서버(localhost:5173)를 실제로 플레이하며 핵심 장면을 PNG로 저장.
//  로컬 모델(aetheria=v3)이 매 턴 생성 → "AI가 직접 쓴다"를 실제 화면으로 증명.
//    npm run dev  (별도로 먼저 실행) 후:  node scripts/capture-trailer.mjs
import { chromium } from 'playwright'
import fs from 'fs'

const URL = process.env.URL || 'http://localhost:5173'
const OUT = process.env.OUT || 'trailer-assets'
const W = 1440, H = 810 // 16:9
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })

// 인트로/튜토리얼 스킵 + 새 게임 + 무음
await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.removeItem('aetheria2099.save.v1')
  localStorage.setItem('aetheria2099.introSeen', '1')
  localStorage.setItem('aetheria2099.tutorialSeen', '1')
  localStorage.setItem('aetheria2099.audio', '0')
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

let shot = 0
const snap = async (name) => {
  const f = `${OUT}/${String(++shot).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: f })
  console.log('📸', f)
}

// 턴 완료 대기: 선택지 3개가 다시 활성화될 때까지(생성 중엔 disabled).
const waitTurn = async () => {
  await page.waitForTimeout(1200)
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('button')].filter((x) => (x.textContent || '').includes('['))
      return b.length >= 3 && b.every((x) => !x.disabled)
    },
    { timeout: 120000 }
  )
  await page.waitForTimeout(800)
}
const clickChoice = async (i = 0) => {
  const b = page.locator('button').filter({ hasText: '[' })
  await b.nth(i).click()
}

// 샷 1: 오프닝(게이지 패널 + 나레이션 + NEXUS 대사 + 선택지)
await snap('opening')

// 샷 2: 생성 중(스트리밍) — 선택 직후 살짝 대기해 "쓰이는 중" 포착 시도
await clickChoice(0)
await page.waitForTimeout(4000)
await snap('streaming')
await waitTurn()

// 샷 3: 생성된 새 비트(대사·선택지 갱신 + 게이지 변화)
await snap('generated-beat')

// 샷 4: 상태 패널 클로즈업(관계 게이지 + NEXUS 추적)
const panel = page.getByText('NEXUS STATUS').locator('xpath=ancestor::*[1]')
try { await panel.screenshot({ path: `${OUT}/04-status-panel.png` }); console.log('📸 04-status-panel.png') } catch {}

// 샷 5~6: 몇 턴 더 진행(렌 정비소 등으로) 캡처
for (const [i, name] of [[0, 'beat-a'], [1, 'beat-b']]) {
  await clickChoice(i)
  await waitTurn()
  await snap(name)
}

await browser.close()
console.log('✅ 캡처 완료 →', OUT)
