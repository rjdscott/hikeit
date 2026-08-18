import type { Derived } from '../model'
import { BOAT_JSON } from '../model'
import { FLAT_MIN } from '../physics/aero'
import { presets, type Action, type PresetName, type State } from '../state'
import { fmt } from './svg'
import { effectiveTwa, isUpwindMode } from '../model'
import { AUTO } from '../physics/sailplan'

interface Props { s: State; d: Derived; dispatch: React.Dispatch<Action> }

function Range({ label, value, min, max, step, unit, onChange, disabled, digits = 0 }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; disabled?: boolean; digits?: number
}) {
  return (
    <div className={`field${disabled ? ' disabled' : ''}`}>
      <label>{label}</label>
      <span className="val">{fmt(value, digits)} {unit}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  )
}

export default function Controls({ s, d, dispatch }: Props) {
  const patch = (p: Partial<State>) => dispatch({ type: 'patch', patch: p })
  const mode = BOAT_JSON.sailModes.find((m) => m.id === d.sailModeId) ?? BOAT_JSON.sailModes[0]
  const upwind = isUpwindMode(s.sailMode)
  return (
    <div>
      <div className="panel-head"><h2>Conditions</h2><span className="hint">AWS {fmt(d.wind.aws, 1)} kn · AWA {fmt(d.wind.awa, 0)}° · boat {fmt(d.wind.bsp, 1)} kn</span></div>
      <Range label="True wind speed" value={s.tws} min={4} max={30} step={0.5} unit="kn" onChange={(v) => patch({ tws: v })} />
      {BOAT_JSON.targets && upwind && (
        <label className="toggle"><input type="checkbox" checked={s.targetAngle} onChange={(e) => patch({ targetAngle: e.target.checked, twa: effectiveTwa(s) })} /> Sail the target angle from the cockpit card (TWA {effectiveTwa({ ...s, targetAngle: true })}° at {fmt(s.tws, 0)} kn)</label>
      )}
      <Range label="True wind angle" value={effectiveTwa(s)} min={mode.twa[0]} max={mode.twa[1]} step={1} unit="°" disabled={s.targetAngle && upwind && !!BOAT_JSON.targets} onChange={(v) => patch({ twa: v })} />
      <div className="field">
        <label>Sails</label>
        <select className="sel" value={s.sailMode} onChange={(e) => {
          const id = e.target.value
          const m = BOAT_JSON.sailModes.find((x) => x.id === id) ?? BOAT_JSON.sailModes[0]
          patch({ sailMode: id, twa: Math.min(m.twa[1], Math.max(m.twa[0], s.twa)), ...(id === AUTO ? { autoTrim: true } : {}) })
        }} aria-label="Sail combination">
          <option value={AUTO}>Auto — change down to hold {s.targetHeel}°</option>
          {BOAT_JSON.sailModes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>
      {s.sailMode === AUTO && <p className="small muted" style={{ marginTop: -4 }}>Flying: <b>{mode.label}</b>{s.autoTrim ? ` — the most sail that holds ${s.targetHeel}° with flat ≥ 0.6.` : ' — full sail; auto changes down only when the trimmers hold a target heel (switch it on above).'}</p>}
      <label className="toggle"><input type="checkbox" checked={s.autoTrim} onChange={(e) => patch({ autoTrim: e.target.checked })} /> Trimmers hold a target heel (auto-depower)</label>
      {s.autoTrim
        ? <Range label="Target heel" value={s.targetHeel} min={5} max={35} step={1} unit="°" onChange={(v) => patch({ targetHeel: v })} />
        : <Range label="Sail power (flat)" value={s.flat} min={FLAT_MIN} max={1} step={0.01} unit="" digits={2} onChange={(v) => patch({ flat: v })} />}
      {s.autoTrim && (
        <p className="small muted">
          Required power: <b className="num">flat = {fmt(d.flat, 2)}</b>{d.trimLimited ? ' — fully depowered and still over target: reef / change down.' : d.underpowered ? ' — full power and still under target: hike less, or more sail.' : ''}
        </p>
      )}
      <div className="panel-head" style={{ marginTop: 12 }}><h2>Crew formation</h2></div>
      <div className="chips">
        {(Object.keys(presets) as PresetName[]).map((name) => (
          <button key={name} className="btn sm" onClick={() => dispatch({ type: 'preset', name })}>{name}</button>
        ))}
        <button className="btn sm" onClick={() => dispatch({ type: 'reset' })} title="Reset conditions and formation">Reset</button>
      </div>
      <label className="toggle" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={s.zPenalty} onChange={(e) => patch({ zPenalty: e.target.checked })} /> Include crew height term (uncheck = ORC-style, arm only)
      </label>
    </div>
  )
}
