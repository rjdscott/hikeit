import { chromium } from 'playwright'
const out = process.argv[2] || 'shot'
const url = process.argv[3] || 'http://localhost:5179/hikeit/'
const width = Number(process.argv[4] || 1380)
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
await p.screenshot({ path: `${out}.png`, fullPage: true })
console.log('errors:', errs.length ? errs.join('\n') : 'none')
await b.close()
