import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME })
for (const url of ['http://localhost:5179/hikeit/', 'http://localhost:5179/hikeit/#tws=16']) {
  const p = await b.newPage({ viewport: { width: 1380, height: 900 } })
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  const t = await p.evaluate(() => document.body.innerText)
  console.log('==', url); console.log(t.split('\n').filter(l => /Heel|Auto|Flying|flat|Trimmers|Sail power|Target heel/i.test(l)).slice(0, 20).join('\n'))
  const sel = await p.evaluate(() => { const s = document.querySelector('select.sel'); return s ? s.options[s.selectedIndex].text : null })
  console.log('select:', sel)
  await p.close()
}
await b.close()
