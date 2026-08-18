// Smoke e2e: drag a rail crew member to the leeward rail and check the model reacts. Run: CHROME=<headless-shell> node scripts/e2e.mjs [url]
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5179/hikeit/'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: 1380, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
await p.goto(url, { waitUntil: 'networkidle' })
const stat = async () => (await p.locator('.stat.crew .v').first().innerText()).trim()
const before = await stat()
const crew = p.locator('g.crew[aria-label^="Crew 1,"]')
const cb = await crew.boundingBox()
const lee = p.locator('.deck-svg g.slot').nth(1) // rail-l-0
const lb = await lee.boundingBox()
await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
await p.mouse.down()
await p.mouse.move(cb.x + 40, cb.y + 40, { steps: 5 })
await p.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2, { steps: 10 })
await p.mouse.up()
await p.waitForTimeout(450)
const after = await stat()
const hash = p.url().split('#')[1] || ''
const moved = /crew=rail-l-0/.test(decodeURIComponent(hash))
// tap-to-select then tap slot: move Crew 2 to Bow
const c2 = p.locator('g.crew[aria-label^="Crew 2,"]')
await c2.click()
await p.locator('.deck-svg g.slot').filter({ hasText: 'Bow' }).click()
await p.waitForTimeout(450)
const hash2 = decodeURIComponent(p.url().split('#')[1] || '')
const bow = /,bow\.|=bow\./.test(hash2) || hash2.includes('bow.0')
// posture cycle: click Crew 3 twice
const c3 = p.locator('g.crew[aria-label^="Crew 3,"]')
await c3.click(); await c3.click()
await p.waitForTimeout(450)
const posture = await c3.getAttribute('aria-label')
// lesson
await p.getByRole('button', { name: 'Start the lesson' }).click()
const lessonTitle = await p.locator('.lesson h3').innerText()
console.log(JSON.stringify({ before, after, moved, bow, posture, lessonTitle, errs }, null, 1))
const ok = moved && bow && /Legs over/.test(posture || '') && errs.length === 0 && before !== after
await b.close()
if (!ok) { console.error('E2E FAILED'); process.exit(1) }
console.log('E2E OK')
