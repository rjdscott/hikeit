import { useState } from 'react'
import { LESSONS, lessonStateAt } from '../data/lessons'
import { derive, type Derived } from '../model'
import type { Action, State } from '../state'
import { fmt } from './svg'

interface Pending { step: number; guess: number }
interface Result { step: number; guess: number; answer: number; explain: string }
const LS = 'hikeit.quiz.v1'
const loadResults = (): Result[] => { try { return JSON.parse(localStorage.getItem(LS) ?? '[]') } catch { return [] } }

export default function Lesson({ s, d, dispatch }: { s: State; d: Derived; dispatch: React.Dispatch<Action> }) {
  const i = s.lessonStep
  const [pending, setPending] = useState<Pending | null>(null)
  const [results, setResults] = useState<Result[]>(loadResults)
  if (i === null) return null
  const step = LESSONS[i]
  if (!step) return null
  const goDirect = (n: number) => {
    if (n < 0) return
    if (n >= LESSONS.length) { dispatch({ type: 'lesson', step: null }); return }
    dispatch({ type: 'lesson', step: n, patch: Math.abs(n - i) === 1 ? LESSONS[n].patch(s) : lessonStateAt(s, n) })
  }
  const go = (n: number) => {
    const q = LESSONS[n]?.quiz
    if (q && n === i + 1) { setPending({ step: n, guess: (q.min + q.max) / 2 }); return }
    setPending(null); goDirect(n)
  }
  const reveal = () => {
    if (!pending) return
    const target = LESSONS[pending.step]
    const after = derive({ ...s, ...target.patch(s) })
    const answer = target.quiz!.answer(d, after)
    const r: Result = { step: pending.step, guess: pending.guess, answer, explain: target.quiz!.explain(d, after) }
    const next = [...results.filter((x) => x.step !== r.step), r]
    setResults(next); try { localStorage.setItem(LS, JSON.stringify(next)) } catch { /* ignore */ }
    setPending(null); goDirect(pending.step)
  }
  const result = results.find((r) => r.step === i)
  const q = pending ? LESSONS[pending.step].quiz! : null
  const score = results.filter((r) => Math.abs(r.guess - r.answer) <= (LESSONS[r.step].quiz!.max - LESSONS[r.step].quiz!.min) * 0.15).length

  return (
    <div className="lesson">
      <div className="step">{pending ? `${pending.step + 1}` : i + 1} / {LESSONS.length}</div>
      <div className="body">
        {pending && q ? (
          <div className="quiz">
            <h3>Predict first</h3>
            <p>{q.question}</p>
            <div className="quiz-slider">
              <input type="range" min={q.min} max={q.max} step={q.step} value={pending.guess} onChange={(e) => setPending({ ...pending, guess: Number(e.target.value) })} aria-label="your guess" />
              <span className="num">{fmt(pending.guess, q.step < 1 ? 1 : 0)} {q.unit}</span>
            </div>
          </div>
        ) : (
          <>
            <h3>{step.title}</h3>
            {result && (
              <div className={`quiz-result ${Math.abs(result.guess - result.answer) <= (step.quiz!.max - step.quiz!.min) * 0.15 ? 'good' : ''}`}>
                <b>You said {fmt(result.guess, 1)} {step.quiz!.unit} — it's {fmt(result.answer, 1)} {step.quiz!.unit}.</b> {result.explain}
              </div>
            )}
            {step.body.map((p, k) => <p key={k}>{p}</p>)}
          </>
        )}
        <div className="dots">{LESSONS.map((l, k) => <button key={k} type="button" className={k === (pending?.step ?? i) ? 'on' : ''} onClick={() => go(k)} aria-label={`Step ${k + 1}: ${l.title}`} aria-current={k === i} />)}{results.length > 0 && <span className="small muted" style={{ marginLeft: 8 }}>quiz {score}/{results.length}</span>}</div>
      </div>
      <div className="nav">
        {pending ? (
          <>
            <button className="btn sm" onClick={() => setPending(null)}>Cancel</button>
            <button className="btn sm primary" onClick={reveal}>Reveal →</button>
          </>
        ) : (
          <>
            <button className="btn sm" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
            <button className="btn sm primary" onClick={() => go(i + 1)}>{i === LESSONS.length - 1 ? 'Finish → sandbox' : LESSONS[i + 1]?.quiz ? 'Next: predict →' : 'Next →'}</button>
          </>
        )}
        <button className="btn sm" onClick={() => { setPending(null); dispatch({ type: 'lesson', step: null }) }} title="Exit lesson">✕</button>
      </div>
    </div>
  )
}
