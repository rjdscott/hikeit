import type { Derived } from '../model'
import { POSTURE_LABEL, POSTURE_OFFSET, type Posture } from '../physics/types'
import type { Action, State } from '../state'
import { fmt, kNm } from './svg'

const ORDER: Posture[] = ['sit', 'legs', 'hike']
const DESC: Record<Posture, string> = {
  sit: 'bum on the side deck, feet inboard',
  legs: 'legs over the lifelines, torso upright',
  hike: 'torso outside the upper lifeline (RRS 49.2 limit)',
}

/** Sitting vs legs-over vs full hike: what the posture of the rail crew is worth. */
export default function PosturePanel({ s, d, dispatch }: { s: State; d: Derived; dispatch: React.Dispatch<Action> }) {
  const railSlots = new Set(d.boat.slots.filter((x) => x.kind === 'rail').map((x) => x.id))
  const railCrew = s.crew.filter((c) => railSlots.has(c.slot))
  const current = railCrew.length ? (ORDER.find((po) => railCrew.every((c) => c.posture === po)) ?? null) : null
  const base = d.postures.sit
  const railKg = railCrew.reduce((a, c) => a + c.kg, 0)
  return (
    <div>
      <div className="panel-head">
        <h2>Sitting vs hiking</h2>
        <span className="hint">{d.railCount} crew on the rail ({railKg} kg) · set all:</span>
        <div className="chips">
          {ORDER.map((po) => (
            <button key={po} className={`btn sm${current === po ? ' active' : ''}`} disabled={!railCrew.length} onClick={() => dispatch({ type: 'railPosture', posture: po, railSlots })}>{POSTURE_LABEL[po]}</button>
          ))}
        </div>
      </div>
      {railCrew.length === 0 ? (
        <p className="small muted">Nobody is on the rail — drag crew to the windward rail slots or pick a racing preset to compare postures.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Posture</th><th className="num mob-hide">arm vs sitting</th><th className="num">RM crew</th>{s.autoTrim ? <><th className="num">power (flat)</th><th className="num">drive</th></> : <><th className="num">heel</th><th className="num">vs sitting</th></>}<th className="num">free wind</th></tr></thead>
            <tbody>
              {ORDER.map((po) => {
                const r = d.postures[po]
                const dPhi = r.phiDeg - base.phiDeg
                return (
                  <tr key={po} style={{ fontWeight: current === po ? 600 : 400 }}>
                    <td>{POSTURE_LABEL[po]}<div className="small muted" style={{ fontWeight: 400 }}>{DESC[po]}</div></td>
                    <td className="num mob-hide">+{fmt(POSTURE_OFFSET[po], 1)} m</td>
                    <td className="num" style={{ color: 'var(--c-crew)' }}>{r.rmCrew >= 0 ? '+' : ''}{kNm(r.rmCrew)} kN·m</td>
                    {s.autoTrim ? (
                      <>
                        <td className="num">{r.flatReq === null ? '–' : fmt(r.flatReq, 2)}</td>
                        <td className="num">{r.drive === null ? '–' : `${fmt(r.drive / 1e3, 2)} kN${po !== 'sit' && base.drive ? ` (${r.drive >= base.drive ? '+' : ''}${fmt((100 * (r.drive - base.drive)) / base.drive, 0)}%)` : ''}`}</td>
                      </>
                    ) : (
                      <>
                        <td className="num">{r.overpowered ? 'over' : fmt(r.phiDeg, 1) + '°'}</td>
                        <td className="num">{po === 'sit' || r.overpowered || base.overpowered ? '–' : `${dPhi <= 0 ? '−' : '+'}${fmt(Math.abs(dPhi), 1)}°`}</td>
                      </>
                    )}
                    <td className="num">{r.freeWind === null ? '–' : `${r.freeWind >= 0 ? '+' : ''}${fmt(r.freeWind, 1)} kn`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 6 }}>
            Full hike moves each rail crew's centre of gravity ~0.4 m further outboard than sitting — on a {fmt(2 * d.boat.halfbeamAt(7.5), 1)} m beam that is +{fmt((100 * POSTURE_OFFSET.hike) / (d.boat.halfbeamAt(7.5) - 0.35), 0)}% lever arm, for the same people. Same wind{s.autoTrim ? ', trimmers holding ' + s.targetHeel + '° — the gain shows up as sail power and drive.' : ', same trim.'}
          </p>
        </div>
      )}
    </div>
  )
}
