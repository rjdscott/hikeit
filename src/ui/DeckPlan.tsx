import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Boat, Posture, Slot } from '../physics/types'
import { POSTURE_LABEL } from '../physics/types'
import type { Crew } from '../state'
import { MULTI } from '../state'
import { svgPoint, useWidth } from './svg'

interface Props {
  boat: Boat
  crew: Crew[]
  hover: number | null
  selected: number | null
  onSelect: (id: number | null) => void
  onHover: (id: number | null) => void
  onMove: (id: number, slot: string) => void
  onPosture: (id: number, posture: Posture) => void
}

const NEXT: Record<Posture, Posture> = { sit: 'legs', legs: 'hike', hike: 'sit' }
const SNAP = 0.9 // m
const R = 0.26 // crew marker radius, m

/** Display position of each crew member (boat frame, m). Multi-occupant slots fan out along x. */
function layout(crew: Crew[], boat: Boat) {
  const groups = new Map<string, Crew[]>()
  for (const c of crew) (groups.get(c.slot) ?? groups.set(c.slot, []).get(c.slot)!).push(c)
  const pos = new Map<number, { x: number; y: number; slot: Slot }>()
  for (const [slotId, list] of groups) {
    const s = boat.slotById[slotId]
    if (!s) continue
    list.forEach((c, k) => {
      // multi-occupant slots fan out in two rows so the group stays inside the coachroof
      const n = list.length, cols = Math.ceil(n / 2), row = n > 5 ? (k < cols ? 0 : 1) : 0, col = row === 0 ? k : k - cols
      const rowN = row === 0 ? cols : n - cols
      const dx = MULTI.has(slotId) ? (col - (rowN - 1) / 2) * 0.6 : 0
      const dy = MULTI.has(slotId) && n > 5 ? (row === 0 ? 0.36 : -0.36) : 0
      const off = s.kind === 'rail' && s.side === 'w' ? { sit: 0, legs: 0.2, hike: 0.4 }[c.posture] : 0
      pos.set(c.id, { x: s.x + dx, y: s.y + dy + off, slot: s })
    })
  }
  return pos
}

export default function DeckPlan({ boat, crew, hover, selected, onSelect, onHover, onMove, onPosture }: Props) {
  const [wrapRef, width] = useWidth<HTMLDivElement>()
  const vertical = width < 560
  const gRef = useRef<SVGGElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Chromium ignores touch-action on SVG children: stop the browser claiming crew drags as page scroll (svg itself stays pan-y)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const h = (e: TouchEvent) => { if ((e.target as Element).closest?.('.crew')) e.preventDefault() }
    el.addEventListener('touchstart', h, { passive: false })
    return () => el.removeEventListener('touchstart', h)
  }, [])
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; moved: boolean; sx: number; sy: number } | null>(null)
  const setSelected = onSelect
  const { loa } = boat.json.hull
  const pos = useMemo(() => layout(crew, boat), [crew, boat])
  const outline = boat.json.deck.outline
  const hullPath = useMemo(() => {
    const top = outline.map(([x, hb]) => `${x},${-hb}`).join(' L')
    const bot = [...outline].reverse().map(([x, hb]) => `${x},${hb}`).join(' L')
    return `M${top} L${bot} Z`
  }, [outline])

  const nearestSlot = useCallback((x: number, y: number): Slot | null => {
    let best: Slot | null = null, bd = SNAP
    for (const s of boat.slots) {
      const d = Math.hypot(s.x - x, s.y - y)
      if (d < bd) { bd = d; best = s }
    }
    return best
  }, [boat.slots])

  const toBoat = (e: React.PointerEvent) => {
    const p = svgPoint(gRef.current!, e)
    return { x: p.x, y: -p.y }
  }

  const onDown = (c: Crew) => (e: React.PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toBoat(e)
    setDrag({ id: c.id, x: p.x, y: p.y, moved: false, sx: e.clientX, sy: e.clientY })
  }
  const onMovePtr = (e: React.PointerEvent<SVGGElement>) => {
    if (!drag) return
    const p = toBoat(e)
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6
    setDrag({ ...drag, x: p.x, y: p.y, moved })
  }
  const onUp = (c: Crew) => (e: React.PointerEvent<SVGGElement>) => {
    if (!drag) return
    if (drag.moved) {
      const s = nearestSlot(drag.x, drag.y)
      if (s && s.id !== c.slot) onMove(c.id, s.id)
    } else if (selected === c.id) {
      // second tap on a selected windward-rail crew cycles posture; elsewhere just keeps the sheet open
      const slot = boat.slotById[c.slot]
      if (slot?.kind === 'rail' && slot.side === 'w') onPosture(c.id, NEXT[c.posture])
    } else setSelected(c.id)
    setDrag(null)
    void e
  }
  const onSlotTap = (s: Slot) => {
    if (selected !== null) onMove(selected, s.id)
  }

  const dropTarget = drag?.moved ? nearestSlot(drag.x, drag.y) : null
  const occupied = new Set(crew.map((c) => c.slot))
  const { cockpit, coachroof } = boat.json.deck
  const mastX = boat.json.rig.mastX

  // viewBox: landscape (bow left, windward up) or portrait (bow up, windward right)
  const pad = 0.6
  const vb = vertical ? `${-2.95} ${-pad} ${5.9} ${loa + 2 * pad}` : `${-pad} ${-2.75} ${loa + 2 * pad} ${5.5}`
  const gT = vertical ? 'rotate(90)' : ''
  const sel = selected !== null ? crew.find((c) => c.id === selected) : null

  return (
    <div ref={wrapRef}>
      <svg ref={svgRef} className="deck-svg" viewBox={vb} style={{ maxHeight: vertical ? '70vh' : undefined }} aria-label="Deck plan with draggable crew">
        <g ref={gRef} transform={gT}>
          {/* wind arrow: from the windward side toward the boat */}
          <g transform={`translate(${mastX - 3.4}, 0)`}>
            <line x1={0} y1={-2.55} x2={0} y2={-1.35} stroke="var(--c-sail)" strokeWidth={0.06} markerEnd="url(#arrow-sail)" />
            <text x={vertical ? 0.55 : 0.18} y={vertical ? -1.9 : -2.15} className="ml" fontSize={0.34} fill="var(--c-sail)" fontWeight={600} textAnchor={vertical ? 'middle' : 'start'} transform={vertical ? 'rotate(-90 0.55 -1.9)' : ''}>WIND</text>
          </g>
          <defs>
            <marker id="arrow-sail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-sail)" /></marker>
          </defs>
          {/* hull */}
          <path d={hullPath} fill="#fbfaf6" stroke="var(--ink)" strokeWidth={0.06} strokeLinejoin="round" />
          {/* lifelines (deck edge inset) */}
          <path d={hullPath} fill="none" stroke="var(--line-strong)" strokeWidth={0.02} transform={`translate(${loa / 2},0) scale(0.985,0.94) translate(${-loa / 2},0)`} />
          <line x1={0.3} y1={0} x2={loa - 0.2} y2={0} stroke="var(--line)" strokeWidth={0.02} strokeDasharray="0.2 0.15" />
          <rect x={coachroof.from} y={-coachroof.halfWidth} width={coachroof.to - coachroof.from} height={2 * coachroof.halfWidth} rx={0.5} fill="#f1efe8" stroke="var(--line-strong)" strokeWidth={0.03} />
          <rect x={cockpit.from} y={-cockpit.halfWidth} width={cockpit.to - cockpit.from} height={2 * cockpit.halfWidth} rx={0.35} fill="#ebe8df" stroke="var(--line-strong)" strokeWidth={0.03} />
          <circle cx={mastX} cy={0} r={0.13} fill="var(--ink)" />
          <text x={mastX} y={0.55} className="ml" fontSize={0.3} textAnchor="middle" transform={vertical ? `rotate(-90 ${mastX} 0.55)` : ''}>mast</text>
          <text x={0.05} y={-0.35} className="ml" fontSize={0.3} transform={vertical ? `rotate(-90 0.05 -0.35)` : ''}>bow</text>
          {vertical ? (
            <>
              <text x={mastX - 2.6} y={-2.15} className="ml" fontSize={0.3} textAnchor="middle" transform={`rotate(-90 ${mastX - 2.6} -2.15)`}>windward</text>
              <text x={mastX - 2.6} y={2.15} className="ml" fontSize={0.3} textAnchor="middle" transform={`rotate(-90 ${mastX - 2.6} 2.15)`}>leeward</text>
            </>
          ) : (
            <>
              <text x={mastX + 2.6} y={-2.3} className="ml" fontSize={0.28} textAnchor="middle">windward rail</text>
              <text x={mastX + 2.6} y={2.55} className="ml" fontSize={0.28} textAnchor="middle">leeward rail</text>
            </>
          )}
          {/* slots */}
          {boat.slots.map((s) => {
            const occ = occupied.has(s.id) && !MULTI.has(s.id)
            const hideLabel = occ || (MULTI.has(s.id) && occupied.has(s.id))
            const target = dropTarget?.id === s.id
            return (
              <g key={s.id} className="slot" onPointerUp={() => onSlotTap(s)} onClick={() => onSlotTap(s)}>
                <circle cx={s.x} cy={-s.y} r={target ? 0.42 : 0.3} fill={target ? 'rgba(217,123,26,0.18)' : 'transparent'}
                  stroke={target ? 'var(--c-crew)' : occ ? 'transparent' : 'var(--line-strong)'} strokeWidth={target ? 0.05 : 0.03} strokeDasharray={target ? '' : '0.08 0.08'} />
                {(s.kind !== 'rail' || s.side === 'w') && !hideLabel && (
                  <text x={s.x} y={-s.y + (s.kind === 'rail' ? (s.side === 'w' ? -0.42 : 0.62) : 0.1)} className="ml" fontSize={0.24} textAnchor="middle" dominantBaseline={s.kind === 'rail' ? 'auto' : 'middle'} transform={vertical ? `rotate(-90 ${s.x} ${-s.y})` : ''}>
                    {s.kind === 'rail' ? s.label.replace('Rail ', '') : s.label}
                  </text>
                )}
              </g>
            )
          })}
          {/* crew */}
          {crew.map((c) => {
            const p = pos.get(c.id)
            if (!p) return null
            const isDrag = drag?.id === c.id
            const x = isDrag && drag.moved ? drag.x : p.x, y = isDrag && drag.moved ? drag.y : p.y
            const rail = p.slot.kind === 'rail'
            const isSel = selected === c.id, isHover = hover === c.id
            const initials = /^crew\s*\d+$/i.test(c.name.trim()) ? String(c.id + 1) : (c.name.trim().split(/\s+/).length > 1 ? c.name.trim().split(/\s+/).map((w) => w[0]).join('') : c.name.trim().slice(0, 2)).slice(0, 2).toUpperCase() || String(c.id + 1)
            return (
              <g key={c.id} className={`crew${isDrag ? ' dragging' : ''}`} style={{ transform: `translate(${x}px, ${-y}px)`, transition: isDrag ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1)' }}
                onPointerDown={onDown(c)} onPointerMove={onMovePtr} onPointerUp={onUp(c)} onPointerCancel={() => setDrag(null)}
                onPointerEnter={() => onHover(c.id)} onPointerLeave={() => onHover(null)} role="button" tabIndex={0}
                aria-label={`${c.name}, ${p.slot.label}${rail && p.slot.side === 'w' ? ', ' + POSTURE_LABEL[c.posture] + '. Enter: cycle posture' : ''}${rail ? '. Arrow keys: move along the rail' : ''}. W, L or B: move to windward rail, leeward rail or below`}
                onKeyDown={(e) => {
                  if (e.metaKey || e.ctrlKey || e.altKey) return
                  const rails = boat.slots.filter((x) => x.kind === 'rail' && x.side === p.slot.side)
                  const idx = rails.findIndex((x) => x.id === c.slot)
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (rail && p.slot.side === 'w') onPosture(c.id, NEXT[c.posture]) }
                  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (idx > 0) onMove(c.id, rails[idx - 1].id) }
                  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (idx >= 0 && idx < rails.length - 1) onMove(c.id, rails[idx + 1].id) }
                  else if (e.key === 'w' || e.key === 'W') onMove(c.id, 'rail-w-4')
                  else if (e.key === 'l' || e.key === 'L') onMove(c.id, 'rail-l-4')
                  else if (e.key === 'b' || e.key === 'B') onMove(c.id, 'below')
                }}>
                {rail && c.posture !== 'sit' && !isDrag && (
                  <line x1={0} y1={0} x2={0} y2={-Math.sign(p.slot.y) * (c.posture === 'hike' ? 0.55 : 0.32)} stroke="var(--c-crew)" strokeWidth={0.12} strokeLinecap="round" />
                )}
                {isSel && <circle r={R + 0.16} fill="none" stroke="var(--c-crew)" strokeWidth={0.05} opacity={0.6} />}
                <circle r={R + (isSel || isHover ? 0.05 : 0)} fill="var(--c-crew)" stroke={isSel ? 'var(--ink)' : '#fff'} strokeWidth={isSel ? 0.07 : 0.05} opacity={isDrag ? 0.85 : 1} />
                <text y={0.02} fontSize={0.24} fill="#fff" fontWeight={700} textAnchor="middle" dominantBaseline="middle" transform={vertical ? 'rotate(-90)' : ''} style={{ pointerEvents: 'none' }}>{initials}</text>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="legend">
        <span>Tap a crew member for their card · drag to a slot, or tap a slot while selected · tap a selected rail crew again to cycle posture</span>
        {sel && <span><b>{sel.name}</b>: {boat.slotById[sel.slot]?.label}{boat.slotById[sel.slot]?.kind === 'rail' ? ` · ${POSTURE_LABEL[sel.posture]}` : ''}</span>}
      </div>
    </div>
  )
}
