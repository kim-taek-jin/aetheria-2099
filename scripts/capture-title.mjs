// 인트로의 글리치 타이틀 화면을 스틸로 캡처(트레일러 타이틀 카드용).
import { chromium } from 'playwright'
const URL = process.env.URL || 'http://localhost:5173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('aetheria2099.introSeen'))
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
// 인트로 영상 재생 중 → 클릭해 타이틀 단계로 스킵
await page.mouse.click(720, 405)
await page.waitForTimeout(1200)
// 타이틀(AETHERIA::2099)이 뜰 때까지
try { await page.waitForSelector('text=AETHERIA', { timeout: 5000 }) } catch {}
await page.waitForTimeout(600)
await page.screenshot({ path: 'trailer-assets/00-title.png' })
console.log('📸 trailer-assets/00-title.png')
await browser.close()
