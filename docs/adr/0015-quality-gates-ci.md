# 0015. Quality gates: lint, unit, e2e + accessibility before every deploy

Status: Accepted
Date: 2026-08-18

## Context
The app is deployed straight from `main` to GitHub Pages. Rob asked for industry best practice and UX excellence; three adversarial review rounds showed that most regressions are visible only in the browser (drag/tap flows, layout on phones, contrast), not in unit tests.

## Decision
`.github/workflows/deploy.yml` runs, in order, and fails the deploy on any error:
1. `npm run lint` — ESLint (typescript-eslint recommended, react-hooks incl. the compiler rules).
2. `npm test` — vitest: physics (validated against ORC-published data), state/URL/localStorage, lessons/quiz, dynamics, sail selection, perf guard.
3. `vite build`, then `scripts/e2e.mjs` with Playwright Chromium against `vite preview` of the production bundle: drag/snap, tap-to-place, posture cycle, lesson start, crew-sheet flow, phone quiz + puff, and an **axe-core WCAG 2.0/2.1 A+AA scan at 1380 px and 400 px** (fails on serious/critical).
4. Upload + deploy.

Locally: `npm run e2e` (needs `CHROME=<playwright headless shell>` or an installed Playwright browser).

## Consequences
- Every deploy is lint-clean, unit-tested, e2e-tested and axe-clean; a broken drag or a contrast regression cannot ship.
- CI takes ~2–3 min longer (browser install).
- Text on light surfaces uses `--c-crew-ink` (≥ 4.5:1) while marks keep the brighter `--c-crew`; both derive from the validated chart palette.
