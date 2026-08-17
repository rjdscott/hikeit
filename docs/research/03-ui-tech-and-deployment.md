# Research 03 — UI technology, prior art, and free deployment

Date: 2026-08-18. Requirements: drag 10 crew figures on a top-down deck plan (snap slots), posture toggles, wind sliders, live moment-vs-heel chart, heeled stern-view section with force arrows, live equations, readouts; responsive; zero backend; free hosting; shareable link.

> **Outcome.** The agent recommended a single vanilla HTML file. The user chose **React + Vite + TypeScript** (see ADR-0001) for extensibility (polars, spinnaker modes) — but the agent's core findings still stand and were adopted: hand-rolled SVG charts, PointerEvents drag, KaTeX, GitHub Pages.

## 1. Stack options

| Option | Verdict (agent) |
|---|---|
| Single `index.html` + inline SVG + vanilla JS | Agent's pick: zero deps, zero build. |
| Vite + Svelte/React + D3 | Only if the app grows past ~1500 lines or component reuse matters; React's re-render model can fight 60 fps drags (use refs/direct DOM writes for the drag ghost). **Chosen by user (React).** |
| Observable / Svelte REPL | Rejected: not a polished shareable app, poor mobile, awkward persistent drag state. |

**Drag-and-drop in SVG** — native `PointerEvent` + `setPointerCapture`:
- `pointerdown` → `el.setPointerCapture(e.pointerId)`; handle `pointermove`; release on `pointerup` **and** `pointercancel`.
- Screen→SVG coords via `svg.getScreenCTM().inverse()` / `DOMPoint.matrixTransform`.
- Mobile: `touch-action: none` on the SVG or the drag becomes a scroll.
- Multi-touch: key drag state by `pointerId`.
- Refs: [setPointerCapture drag](https://blog.r0b.io/post/creating-drag-interactions-with-set-pointer-capture-in-java-script/), [Red Blob Games — draggable](https://www.redblobgames.com/making-of/draggable/), [Peter Collingridge — SVG dragging](https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/).

**Charts** — hand-roll SVG: two smooth curves + axes + one marker is a `<polyline>` and two `<line>`s (~40 lines). D3 (~250 KB) / Plotly (~3 MB) / Chart.js (~125 KB gz, canvas) are overkill and won't match the page's visual system. `uPlot` (~45 KB) is the smallest escape hatch if needed. Shared coordinate system + CSS theme across deck plan, section and chart makes the page read as one object.

**Equations** — KaTeX (synchronous, ~10× faster than MathJax). For live numbers call `katex.render`/`renderToString` per equation into a fixed element instead of re-running auto-render every frame. CDN works on GitHub Pages; bundling via npm is equally fine. Refs: [KaTeX browser](https://katex.org/docs/browser.html), [auto-render](https://katex.org/docs/autorender.html), [jsDelivr](https://www.jsdelivr.com/package/npm/katex).

**Responsive** — CSS Grid with `grid-template-areas`, one media query to single column; SVGs with `viewBox` + `width:100%`.

## 2. Free hosting

| Host | Setup | Custom domain | Build |
|---|---|---|---|
| **GitHub Pages** | Lowest for an existing repo; Settings → Pages | Free + Let's Encrypt HTTPS | Actions workflow if needed |
| Cloudflare Pages | Connect GitHub, ~2 min | Free (domain on CF) | Yes, 500 builds/mo, unmetered bandwidth |
| Netlify | Connect GitHub or drag-drop | Free | Yes; 100 GB/mo |
| Vercel | Connect GitHub | Free | Yes; free tier non-commercial |

Recommendation: no build → GitHub Pages from `main`; Vite build → Cloudflare Pages or GitHub Pages via `actions/deploy-pages` with `base: '/hikeit/'` (the classic blank-page trap). Chosen: **GitHub Pages via Actions** (ADR-0003). GitHub Pages free tier prohibits commercial use; educational sim is fine.

Docs: [Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Vite static deploy](https://vite.dev/guide/static-deploy), [static host comparison 2026](https://guptadeepak.com/tools/top-5-static-site-hosting-jamstack-platforms-2026/).

## 3. Existing stability visualisations (inspiration)

**The one to study** — [Bartosz Ciechanowski, "Naval Architecture"](https://ciechanow.ski/naval-architecture/): buoyancy from pressure arrows, draggable heel showing the righting arm as the gap between gravity and buoyancy verticals, heel-vs-stability plot with self-righting/capsizing zones, cargo loader shifting CoG, free-surface effect. Steal the pedagogy and arrow vocabulary, not the WebGL renderer.

Domain tools (functional, mostly ugly):
- [Seldén RM Calculator](https://support.seldenmast.com/en/services/calculators/rm_calculator.html) — inputs beam, draft, displacement, ballast, keel type, **number of crew on the rail**; static RM at 30°. Good for sanity-checking numbers.
- [Nautical Solver GZ Curve Generator](https://nauticalsolver.com/calculators/stability/gz-curve/gz-curve.php) — GZ from KN cross-curves, marks AVS, ranges, areas.
- [MetaCAD Ship Stability Calculator](https://metacad.io/en/stability/ship-stability-calculator/) — GZ, GM, IMO criteria, free-surface.
- [SailSkills stability explainer](https://sailskills.co.uk/Stability/sailskills_stability_stability_explained_righting_GZ_curves.html), [Sailboat-Cruising GZ curves](https://www.sailboat-cruising.com/gz-curves.html), [M.B. Marsh — monohull stability curves](https://marine.marsh-design.com/content/understanding-monohull-sailboat-stability-curves), [Practical Sailor — Staying Upright](https://www.practical-sailor.com/safety-seamanship/special-report-dissecting-the-art-of-staying-upright/).

Formula sources: [ORC VPP Documentation](https://orc.org/uploads/files/ORC-VPP-Documentation-2023.pdf), [ORC Rating Systems 2026](https://orc.org/uploads/files/Rules-Regulations/2026/ORC-Rating-Systems-2026.pdf) (RMC = RM + 0.0175·(WCB_A·CBD_A + WCB_B·CBD_B)), [Science of Sailing — RM/sideforce](https://scienceofsailing.blogspot.com/2018/04/righting-moment-sideforce-calculation.html), [Hiking (sailing)](https://en.wikipedia.org/wiki/Hiking_(sailing)), [Forces on sails](https://en.wikipedia.org/wiki/Forces_on_sails).

Existing JS sailing sims (none does this): [By The Lee](https://github.com/leeboardtools/bythelee), [VesselJS](https://github.com/shiplab/vesseljs), [VibeSail](https://vibesail.com/).

**Bottom line: no existing crew-placement / hiking righting-moment interactive exists.**

## 4. Xp 44 deck plan / hull section references

No free CAD/vector drawing; raster brochure art only:
- [Yumpu — official Xp 44 brochure](https://www.yumpu.com/en/document/view/10489429/download-the-xp-44-brochure-x-yachts)
- [NauticExpo catalog](https://pdf.nauticexpo.com/pdf/x-yachts/xp-44/20312-41829.html) (view in browser); [X-Yachts catalog set](https://pdf.nauticexpo.com/pdf/x-yachts-20312.html)
- [Boat-Specs gallery](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) (sailplan + layout drawings)
- [SailboatData](https://sailboatdata.com/sailboat/xp-44/), [X-Yachting](https://x-yachting.com/fleet/x-yachts-xp44), [Cruising World](https://www.cruisingworld.com/sailboats/xp-44-sailors-sailboat/)

Recommendation: do not trace brochure art (copyright, aesthetic mismatch); hand-draw a stylised outline from published dimensions (13.3 × 4.07 m, cockpit aft third, mast ~40 % aft of bow). Public-domain starting outline: [FreeSVG sail yacht top view (CC0)](https://freesvg.org/1551574641).

## 5. Design references for physics interactives

- [Bartosz Ciechanowski](https://ciechanow.ski/) — one idea per diagram; consistent arrow/colour vocabulary; direct manipulation; prose adjacent to figure.
- [PhET research](https://phet.colorado.edu/en/research) — minimal text, immediate feedback, multiple simultaneous representations (picture + graph + number); quantitative sims outperform qualitative ones.
- [Nicky Case — Explorable Explanations](https://blog.ncase.me/explorable-explanations/), [4 More Design Patterns](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/) — teach mechanics in isolation then combine; end with a sandbox.
- Directories: [explorabl.es](https://explorabl.es/), [awesome-explanations](https://github.com/BHSPitMonkey/awesome-explanations), [awesome-explorables](https://github.com/blob42/awesome-explorables); [Explorable explanation (Wikipedia)](https://en.wikipedia.org/wiki/Explorable_explanation).

Applied: colour-code each force once and reuse in deck plan, section, chart series, equations and readouts; single source of truth in state; numbers update while dragging, not on release.
