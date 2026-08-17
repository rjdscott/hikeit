# ADR-0001 — React + Vite + TypeScript stack

**Status:** Accepted  
**Date:** 2026-08-18

## Context
hikeit is a single-page interactive simulator (deck plan drag, heeled section, charts, live equations, lesson stepper). Research ([03](../research/03-ui-tech-and-deployment.md)) found a single vanilla HTML file would suffice today, with Svelte or React as the escape hatch once the app grows or needs component reuse. The owner asked for a path to later import real ORC polars and spinnaker sail modes, and stated a preference for React over Svelte.

## Decision
Use React 18 + Vite + TypeScript. Keep the dependency list minimal: `react`, `react-dom`, `katex`; dev-only `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`. Physics lives in pure, framework-free TypeScript modules under `src/physics/` so it can be unit-tested and reused independently of the UI.

## Consequences
- Component structure and typed boat config make the polar/spinnaker extension straightforward.
- A build step is required (Vite) → GitHub Pages must deploy via Actions with `base: '/hikeit/'` (ADR-0003).
- React re-renders during 60 fps drags must be kept cheap: memoised derived state, narrow props, drag ghost driven directly where needed.
- Vanilla/Svelte alternatives rejected on user preference; not revisited.
