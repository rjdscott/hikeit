# Architecture Decision Records

| ADR | Title |
|---|---|
| [0001](0001-react-vite-typescript-stack.md) | React + Vite + TypeScript stack |
| [0002](0002-no-chart-drag-state-libraries.md) | No chart, drag, or state-management libraries |
| [0003](0003-github-pages-via-actions.md) | Deploy to GitHub Pages via GitHub Actions |
| [0004](0004-parametric-gz-curve-calibrated-to-orc.md) | Parametric GZ curve calibrated to ORC certificate data |
| [0005](0005-crew-as-added-weight-with-z-term.md) | Crew as added point masses with transverse and vertical terms |
| [0006](0006-data-driven-boat-config.md) | Data-driven boat configuration (`xp44.json`) |
| [0007](0007-heeling-moment-model.md) | Heeling moment, depowering, and drive-force payoff |
| [0008](0008-verification-strategy.md) | Verification strategy |
| [0009](0009-lesson-plus-sandbox-format.md) | Dashboard + guided lesson, URL sharing, persistence, light theme |
| [0010](0010-crew-moments-relative-to-orc-sailing-trim.md) | Crew moments relative to ORC sailing trim (z₀ = 0.98 m, no mass double-count; amends 0005) |
| [0011](0011-crew-bottom-sheet-interaction.md) | Tap a crew member → bottom sheet (drag retained) |
| [0012](0012-roll-dynamics-puff-mode.md) | Puff mode: 1-DOF roll dynamics on top of the static model |
| [0013](0013-sail-inventory-auto-selection.md) | Sail inventory with ranked modes and automatic sail selection; deep keel + carbon rig data |
| [0014](0014-pinned-ab-compare-and-quiz.md) | Pinned A/B comparison, predict-then-reveal quiz, PWA + MIT |

Format: Title, Status, Date, Context, Decision, Consequences. Research backing these decisions is in [../research](../research/README.md); the approved implementation plan is in [../plans](../plans/).
- [0015 — Quality gates in CI](0015-quality-gates-ci.md) — lint, unit, e2e + axe before deploy
