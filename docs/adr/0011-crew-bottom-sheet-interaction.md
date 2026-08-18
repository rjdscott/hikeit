# ADR-0011 — Tap a crew member → bottom sheet (drag retained)

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The lesson is delivered mostly on phones and iPads. In v1 the only ways to change a person were drag-and-drop on the deck plan and a wide crew table with `<select>`s. Rob's feedback: "the moving around of the crew and their linking to their status is a little clunky" — the marker on deck, the row in the table and the numbers that person produces lived in three places, and precise dragging on a phone is fiddly.

## Decision
- Tapping a crew marker (or a row in the crew list) opens a **bottom sheet** for that person — one place per person: avatar + editable name and weight, current position/posture/arm and their kN·m with a bar, a **segmented posture control** (sitting / legs over / full hike, each showing +m and ΔkN·m at the current heel), and **position chips** grouped as windward rail 1–8, cockpit & deck, leeward. Chips show the current occupant's initials; tapping an occupied chip swaps. ‹ › walk through the crew; Esc/✕ closes.
- Drag-and-drop stays for people who prefer it, with an animated snap (CSS transform transition on the SVG group), a selection ring, and tap-slot-while-selected still working. A second tap on a selected windward-rail crew cycles posture (kept for speed).
- The old crew table becomes a compact **crew list** with per-person contribution bars; tapping a row opens the same sheet. Name/weight editing lives in the sheet only.
- Selection is React UI state in `App`, not reducer state; the sheet is `position: fixed` bottom-centre on all sizes (max 560 px), so desktop gets the same single flow.

## Consequences
- One mental model: "tap the person, everything about them is right there." Fewer mis-drags on touch; keyboard/screen-reader users get the same actions via the list.
- The sheet covers ~half the phone viewport while open — acceptable because the numbers you care about (heel, crew RM) are in the sticky mini status bar; the sheet closes with one tap.
- Chip labels for rail slots are terse ("1"–"8"); with placeholder crew names the occupant badge duplicates the number — resolves once real names are entered.
