# ADR-0002 — No chart, drag, or state-management libraries

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The UI needs: two smooth curves with axes and a marker; ten draggable figures snapping to slots on an SVG deck plan; a handful of sliders; derived physics values. Research showed D3/Plotly/Chart.js are 100 KB–3 MB for what is a `<polyline>` and two axes, and that native `PointerEvent` + `setPointerCapture` handles mouse/touch/pen in one code path.

## Decision
- Charts: hand-rolled SVG (`linePath`, `niceTicks`, `useSize` ResizeObserver) sharing CSS-variable colours with the deck plan and section.
- Drag: `pointerdown` → `setPointerCapture`, `pointermove`, release on `pointerup`/`pointercancel`; screen→SVG via `getScreenCTM().inverse()`; `touch-action: none; user-select: none` on the SVG; snap to nearest slot within 0.9 m else revert; tap-crew-then-tap-slot fallback for touch.
- State: a single `useReducer` in `App` with a memoised derived pipeline (boat → crew points → apparent wind → flat → curves → equilibrium → sweep). No Redux/Zustand.

## Consequences
- Small bundle; one visual system across every panel.
- Charts are purpose-drawn; if richer axes are ever needed, `uPlot` (~45 KB) is the smallest upgrade.
- `touch-action: none` blocks page scroll over the deck plan on phones — mitigated by capping the deck plan height and offering tap-to-place.
