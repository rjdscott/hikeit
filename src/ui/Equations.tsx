import { memo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Derived } from '../model'
import { DEG, G, RHO_AIR, KN } from '../physics/types'
import { fmt } from './svg'

const Eq = memo(function Eq({ tex, cap }: { tex: string; cap: string }) {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { displayMode: true, throwOnError: false }) }} />
      <div className="cap">{cap}</div>
    </div>
  )
})

const k = (v: number, d = 1) => fmt(v / 1e3, d)

/** Live equations with the current numbers substituted. */
export default function Equations({ d }: { d: Derived }) {
  const b = d.boat
  const phi = d.eq.phi
  const gzHull = d.rmHullEq / (b.disp * G)
  const q = 0.5 * RHO_AIR * (d.wind.aws * KN) ** 2
  const crewSum = d.perCrew.reduce((a, p) => a + p.m, 0)
  const yAvg = crewSum ? d.perCrew.reduce((a, p) => a + p.m * p.y, 0) / crewSum : 0
  const zAvg = crewSum ? d.perCrew.reduce((a, p) => a + p.m * p.z, 0) / crewSum : 0
  const cs = Math.cos(phi), sn = Math.sin(phi)
  return (
    <div>
      <div className="panel-head"><h2>The maths, live</h2><span className="hint">values update as you move crew or wind · φ = {fmt(phi / DEG, 1)}°</span></div>
      <div className="eq-grid">
        <Eq cap="Hull + keel righting moment. Parametric GZ curve fitted to ORC certificate data (GM from RM at 1°)."
          tex={`RM_{hull} = \\Delta g\\, GZ(\\varphi),\\quad GZ = GM\\sin\\varphi\\Big[1-\\big(\\tfrac{\\varphi}{\\varphi_v}\\big)^{n}\\Big] = ${fmt(b.gm, 2)}\\cdot${fmt(sn, 3)}\\cdot${fmt(1 - Math.pow(Math.abs(phi) / b.avs, b.n), 3)} = ${fmt(gzHull, 3)}\\,\\text{m}`} />
        <Eq cap={`Δ = ${b.disp} kg sailing displacement without crew.`}
          tex={`RM_{hull} = ${b.disp}\\cdot 9.81\\cdot ${fmt(gzHull, 3)} = \\mathbf{${k(d.rmHullEq)}\\ \\text{kN·m}}`} />
        <Eq cap="Crew: transverse arm helps (∝ cos φ), height above G hurts (∝ sin φ). Summed over every person."
          tex={`RM_{crew} = \\sum_i m_i g\\big(y_i\\cos\\varphi - (z_i - z_G)\\sin\\varphi\\big)`} />
        <Eq cap={`Mass-weighted averages of the current formation: ȳ = ${fmt(yAvg, 2)} m, z̄ = ${fmt(zAvg, 2)} m, z_G = ${fmt(b.zG, 2)} m${d.zPenalty ? '' : ' (height term switched off)'}.`}
          tex={`RM_{crew} = ${crewSum}\\cdot 9.81\\big(${fmt(yAvg, 2)}\\cdot${fmt(cs, 3)} ${d.zPenalty ? `- ${fmt(zAvg - b.zG, 2)}\\cdot${fmt(sn, 3)}` : ''}\\big) = \\mathbf{${d.rmCrewEq >= 0 ? '+' : ''}${k(d.rmCrewEq)}\\ \\text{kN·m}}`} />
        <Eq cap={`Apparent wind from true wind ${fmt(d.wind.tws, 1)} kn at ${fmt(d.wind.twa, 0)}° and boat speed ${fmt(d.wind.bsp, 1)} kn (polar).`}
          tex={`V_{aw} = \\sqrt{V_{tw}^2 + V_b^2 + 2V_{tw}V_b\\cos(TWA)} = ${fmt(d.wind.aws, 1)}\\ \\text{kn},\\quad \\beta = ${fmt(d.wind.awa, 0)}^\\circ`} />
        <Eq cap={`Heeling coefficient from lift and drag at the apparent wind angle β; flat = ${fmt(d.flat, 2)} scales lift.`}
          tex={`C_H = C_L\\cos\\beta + C_D\\sin\\beta = ${fmt(d.coeffs.cl, 2)}\\cdot${fmt(Math.cos(d.wind.awa * DEG), 2)} + ${fmt(d.coeffs.cd, 2)}\\cdot${fmt(Math.sin(d.wind.awa * DEG), 2)} = ${fmt(d.coeffs.ch, 2)}`} />
        <Eq cap={`Heeling moment: dynamic pressure × sail area × C_H × arm (CE to keel centre of pressure, h = ${fmt(d.arm, 1)} m) × cos²φ.`}
          tex={`HM = \\tfrac12\\rho V_{aw}^2 A\\, C_H\\, h\\cos^2\\varphi = ${fmt(q, 0)}\\cdot${fmt(b.area, 0)}\\cdot${fmt(d.coeffs.ch, 2)}\\cdot${fmt(d.arm, 1)}\\cdot${fmt(cs * cs, 3)} = \\mathbf{${k(d.hmEq)}\\ \\text{kN·m}}`} />
        <Eq cap={d.eq.overpowered ? 'No angle satisfies this — heeling moment exceeds the maximum righting moment: overpowered.' : 'Static equilibrium: the boat settles where righting balances heeling.'}
          tex={`RM_{hull} + RM_{crew} = HM \\;\\Rightarrow\\; ${k(d.rmHullEq)} ${d.rmCrewEq >= 0 ? '+' : '-'} ${k(Math.abs(d.rmCrewEq))} ${d.eq.overpowered ? '<' : '='} ${k(d.hmEq)} \\;\\Rightarrow\\; \\varphi = ${d.eq.overpowered ? '\\text{none}' : `\\mathbf{${fmt(phi / DEG, 1)}^\\circ}`}`} />
      </div>
    </div>
  )
}
