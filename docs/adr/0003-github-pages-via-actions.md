# ADR-0003 — Deploy to GitHub Pages via GitHub Actions

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The app must be free to host and shareable by link with the crew. The repo already lives at `github.com/rjdscott/hikeit`. Alternatives assessed: Cloudflare Pages (unmetered bandwidth, needs account link), Netlify (100 GB/mo), Vercel (non-commercial free tier). Because we use a Vite build (ADR-0001), plain branch publishing is not enough.

## Decision
`.github/workflows/deploy.yml` on push to `main`: `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. Vite `base: '/hikeit/'`. Repo Settings → Pages → Source = "GitHub Actions" (one-time manual step). Site URL: `https://rjdscott.github.io/hikeit/`.

## Consequences
- Zero cost, no third-party account, tests gate every deploy.
- Must remember the `base` path (classic blank-page-on-deploy trap); no router so no 404 fallback needed.
- GitHub Pages free tier disallows commercial use — fine for an educational tool.
- Cloudflare Pages remains the fallback if bandwidth or custom-domain needs grow.
