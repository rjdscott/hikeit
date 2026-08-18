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
// --- sheet flow: open Crew 4's card, move via chip, change posture via segmented control ---
{
  const b2 = await chromium.launch({ executablePath: process.env.CHROME || undefined })
  const q = await b2.newPage({ viewport: { width: 400, height: 800 } })
  await q.goto(url, { waitUntil: 'networkidle' })
  await q.locator('g.crew[aria-label^="Crew 4,"]').click()
  await q.locator('.sheet').waitFor()
  await q.locator('.sheet .btn', { hasText: 'Below decks' }).click()
  await q.waitForTimeout(450)
  const h1 = decodeURIComponent(q.url().split('#')[1] || '')
  const okBelow = /(^|,)[^,]*?below\.0/.test(h1.split('crew=')[1] || '') && (h1.split('crew=')[1] || '').split(',')[3].startsWith('below')
  await q.locator('.sheet .btn', { hasText: /^5/ }).first().click() // back to windward rail 5 (swap)
  await q.waitForTimeout(100)
  await q.locator('.seg button', { hasText: 'Full hike' }).click()
  await q.waitForTimeout(450)
  const h2 = decodeURIComponent(q.url().split('#')[1] || '')
  const c4 = (h2.split('crew=')[1] || '').split(',')[3]
  console.log(JSON.stringify({ okBelow, c4 }))
  await b2.close()
  if (!okBelow || c4 !== 'rail-w-4.2') { console.error('E2E SHEET FAILED'); process.exit(1) }
  console.log('E2E SHEET OK')
}
// --- accessibility (axe) on desktop + phone, and phone quiz/puff smoke ---
{
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  const b3 = await chromium.launch({ executablePath: process.env.CHROME || undefined })
  let violations = []
  for (const width of [1380, 400]) {
    const ctx = await b3.newContext({ viewport: { width, height: 900 } })
    const q = await ctx.newPage()
    await q.goto(url, { waitUntil: 'load' })
    await q.waitForTimeout(500)
    const res = await new AxeBuilder({ page: q }).withTags(['wcag2a', 'wcag2aa']).exclude('.katex').analyze()
    violations.push(...res.violations.map((v) => `${width}px ${v.id} (${v.impact}): ${v.nodes.length} × ${v.help}`))
    if (width === 400) {
      // quiz + puff on the phone
      await q.getByRole('button', { name: 'Start the lesson' }).click()
      await q.getByRole('button', { name: 'Next →' }).click()
      await q.getByRole('button', { name: 'Next: predict →' }).click()
      await q.locator('.quiz-slider input').fill('4')
      await q.getByRole('button', { name: 'Reveal →' }).click()
      await q.locator('.quiz-result').waitFor()
      await q.getByRole('button', { name: 'Puff!' }).click()
      await q.waitForTimeout(600)
      const tracePts = await q.locator('svg[aria-label="Heel angle during the puff"] path').count()
      if (tracePts < 1) { console.error('E2E PHONE PUFF FAILED'); process.exit(1) }
    }
    await ctx.close()
  }
  await b3.close()
  const serious = violations.filter((v) => /critical|serious/.test(v))
  console.log('axe:', violations.length ? violations.join('\n') : 'no violations')
  if (serious.length) { console.error('E2E A11Y FAILED'); process.exit(1) }
  console.log('E2E PHONE + A11Y OK')
}
