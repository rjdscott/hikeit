# ADR-0009 — Dashboard + guided lesson, URL sharing, local persistence, light theme

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The owner will run a lesson for a 10-person crew (experienced club racers, light on maths) and then share the tool. Explorable-explanation research (Nicky Case, PhET, Ciechanowski) favours teaching mechanics in isolation, multiple simultaneous representations, and ending with a sandbox.

## Decision
- **Format**: one dashboard (deck plan, heeled section, moment chart, wind-sweep chart, equations, readouts, advanced) plus a **lesson stepper** (~8 steps, each patching state and showing short sailing-language prose) that ends in free sandbox mode.
- **Sharing**: formation + wind + settings encoded in the URL hash so a specific scenario can be sent as a link.
- **Persistence**: crew names/weights and last formation kept in `localStorage`; default crew are "Crew 1–10" at 85 kg, editable in-app.
- **Look**: clean light editorial theme (paper background, navy/teal), one colour per concept reused across every panel (sail/heeling = orange, buoyancy = teal, gravity/hull RM = navy, crew = amber, equilibrium = red, ghost = grey). Metric units + knots. Responsive CSS grid, single column under 900 px.

## Consequences
- Works projected in a clubroom and on phones; the sandbox stays available inside the lesson.
- URL-hash encoding adds a small serialiser and must stay backward-compatible as state grows.
- Dark theme and imperial units are out of scope for now.
