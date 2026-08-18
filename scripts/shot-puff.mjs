import { chromium } from 'playwright'
const [,, out, url, width] = process.argv
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: Number(width || 1380), height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto(url + '#tws=12&flat=0.85', { waitUntil: 'load' })
await p.getByRole('button', { name: 'Puff!' }).click()
await p.waitForTimeout(3300)
await p.screenshot({ path: out.replace('.png', '_mid.png'), fullPage: true })
await p.waitForTimeout(11500)
await p.screenshot({ path: out, fullPage: true })
console.log('errors', errs)
await b.close()
