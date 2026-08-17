import { LESSONS } from '../data/lessons'
import type { Action, State } from '../state'

export default function Lesson({ s, dispatch }: { s: State; dispatch: React.Dispatch<Action> }) {
  const i = s.lessonStep
  if (i === null) return null
  const step = LESSONS[i]
  const go = (n: number) => {
    if (n < 0) return
    if (n >= LESSONS.length) { dispatch({ type: 'lesson', step: null }); return }
    dispatch({ type: 'lesson', step: n, patch: LESSONS[n].patch(s) })
  }
  return (
    <div className="lesson">
      <div className="step">{i + 1} / {LESSONS.length}</div>
      <div className="body">
        <h3>{step.title}</h3>
        {step.body.map((p, k) => <p key={k}>{p}</p>)}
        <div className="dots">{LESSONS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} onClick={() => go(k)} role="button" aria-label={`step ${k + 1}`} />)}</div>
      </div>
      <div className="nav">
        <button className="btn sm" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
        <button className="btn sm primary" onClick={() => go(i + 1)}>{i === LESSONS.length - 1 ? 'Finish → sandbox' : 'Next →'}</button>
        <button className="btn sm" onClick={() => dispatch({ type: 'lesson', step: null })} title="Exit lesson">✕</button>
      </div>
    </div>
  )
}
