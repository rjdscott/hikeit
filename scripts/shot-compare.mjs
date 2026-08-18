import { chromium } from 'playwright'
const [,, out, url, width] = process.argv
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: Number(width || 1380), height: 900 } })
await p.goto(url, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'Pin as A' }).click()
await p.getByRole('button', { name: 'All below' }).click()
await p.waitForTimeout(500)
await p.screenshot({ path: out, fullPage: true })
await b.close()
