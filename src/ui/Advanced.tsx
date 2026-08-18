import { BOAT_JSON, type Derived } from '../model'
import { gmFromRm1, rm1FromGm } from '../physics/boat'
import type { Action, State } from '../state'
import { fmt } from './svg'

export default function Advanced({ s, d, dispatch }: { s: State; d: Derived; dispatch: React.Dispatch<Action> }) {
  const ov = s.overrides
  const set = (p: Partial<State['overrides']>) => dispatch({ type: 'patch', patch: { overrides: { ...ov, ...p } } })
  const rm1 = rm1FromGm(d.boat.gm, d.boat.disp)
  const row = (label: string, val: string, input: React.ReactNode) => (
    <div className="field"><label>{label}</label><span className="val">{val}</span>{input}</div>
  )
  return (
    <details>
      <summary>Advanced — stability & rig parameters, assumptions, boat data</summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 24px', marginTop: 8 }}>
        <div>
          {row('RM at 1° (ORC certificate)', `${fmt(rm1, 0)} kg·m/° → GM ${fmt(d.boat.gm, 2)} m`,
            <input type="range" min={180} max={360} step={1} value={rm1} onChange={(e) => set({ gm: gmFromRm1(Number(e.target.value), d.boat.disp) })} aria-label="RM at 1 degree" />)}
          {row('Angle of vanishing stability', `${fmt(d.boat.avs * 57.2958, 0)}°`,
            <input type="range" min={100} max={140} step={1} value={ov.avsDeg ?? BOAT_JSON.stability.avsDeg} onChange={(e) => set({ avsDeg: Number(e.target.value) })} aria-label="AVS" />)}
          {row('GZ curve shape n', fmt(d.boat.n, 2),
            <input type="range" min={1.3} max={2.0} step={0.05} value={d.boat.n} onChange={(e) => set({ n: Number(e.target.value) })} aria-label="GZ shape exponent" />)}
          {row('Heeling coefficient scale', `× ${fmt(d.boat.chScale, 2)}`,
            <input type="range" min={0.7} max={1.3} step={0.01} value={d.boat.chScale} onChange={(e) => set({ chScale: Number(e.target.value) })} aria-label="heeling coefficient scale" />)}
          <button className="btn sm" onClick={() => dispatch({ type: 'patch', patch: { overrides: {} } })}>Reset to certificate defaults</button>
        </div>
        <div className="small muted">
          <p><b>What this model is.</b> An educational static-equilibrium model, plus a one-degree-of-freedom roll model for puffs (fixed inertia and damping). Not a VPP or a safety tool.</p>
          <ul style={{ paddingLeft: 18, margin: '4px 0' }}>
            <li>Hull GZ is a 3-parameter curve (GM, AVS, n) fitted to ORC-published stability data — within ~2% to 40° on the reference boat. GM comes from the class-median ORC "RM at 1°" ({BOAT_JSON.stability.rm1} kg·m/°); sisterships vary ±10%.</li>
            <li>The ORC sailing displacement and RM already carry the default crew (~930 kg) on the centreline about 1 m above the waterline; crew moments are pure weight shifts from that reference, so the boat's mass is not double-counted.</li>
            <li>Sail force uses ORC-style lift/drag tables vs apparent wind angle, induced drag from rig span, a cos²φ heel reduction, and the ORC "flat" + twist depower model. Heeling arm = CE height + 0.43 × draft.</li>
            <li>Boat speed comes from the cockpit target card when "Sail the target angle" is on (upwind speeds provisional until confirmed), otherwise from a seed polar (replace with your ORC polar in <code>xp44.json</code>). No leeway, pitch, waves or crew-movement dynamics; the puff adds roll only.</li>
            <li>Rules: RRS 49.2 — torso inside the lifelines except briefly for a necessary task; on boats with upper and lower lifelines, sitting on deck facing outboard with the waist inside the lower lifeline the upper body may be outside the upper lifeline. That pose is the "full hike" (+0.4 m); "legs over" with the torso inside is always legal.</li>
          </ul>
          <p>Boat: {BOAT_JSON.name} · LOA {BOAT_JSON.hull.loa} m · beam {BOAT_JSON.hull.beam} m · draft {BOAT_JSON.hull.draft} m · Δ {BOAT_JSON.hull.dispSailing} kg · ballast {BOAT_JSON.hull.ballast} kg · main {BOAT_JSON.sails[0].area} m² · jib {BOAT_JSON.sails[1].area} m². Full sources in <a href="https://github.com/rjdscott/hikeit/tree/main/docs/research">docs/research</a>; independent review log in <a href="https://github.com/rjdscott/hikeit/tree/main/docs/reviews">docs/reviews</a>.</p>
        </div>
      </div>
    </details>
  )
}
