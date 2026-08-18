/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Fill the service-worker template with this build's hashed assets and a per-build cache name. */
function swAssets(): Plugin {
  return {
    name: 'hikeit-sw-assets',
    apply: 'build',
    closeBundle() {
      const dist = 'dist'
      const assets = readdirSync(join(dist, 'assets')).filter((f) => /\.(js|css)$/.test(f)).map((f) => `/hikeit/assets/${f}`).sort()
      const hash = createHash('sha1').update(assets.join('\n')).digest('hex').slice(0, 10)
      const swPath = join(dist, 'sw.js')
      const sw = readFileSync(swPath, 'utf8').replace('__CACHE__', `hikeit-${hash}`).replace('__ASSETS__', JSON.stringify(assets))
      writeFileSync(swPath, sw)
    },
  }
}

export default defineConfig({
  base: '/hikeit/',
  plugins: [react(), swAssets()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
