import { chromium } from 'playwright'
const [,, out, url, width] = process.argv
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: Number(width || 400), height: 800 } })
await p.goto(url, { waitUntil: 'networkidle' })
await p.locator('g.crew[aria-label^="Crew 3,"]').click()
await p.waitForTimeout(400)
await p.screenshot({ path: out, fullPage: false })
await b.close()
