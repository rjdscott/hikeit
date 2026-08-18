import { useEffect, useState } from 'react'
import { LESSONS, lessonStateAt } from '../data/lessons'
import { derive, type Derived } from '../model'
import type { Action, State } from '../state'
import { fmt } from './svg'

interface Pending { step: number; guess: number | null }
interface Result { step: number; guess: number; answer: number; explain: string }
const LS = 'hikeit.quiz.v1'
const isResult = (r: unknown): r is Result => {
  const x = r as Result
  return !!x && Number.isInteger(x.step) && !!LESSONS[x.step]?.quiz && Number.isFinite(x.guess) && Number.isFinite(x.answer) && typeof x.explain === 'string'
}
const loadResults = (): Result[] => { try { const d: unknown = JSON.parse(localStorage.getItem(LS) ?? '[]'); return Array.isArray(d) ? d.filter(isResult) : [] } catch { return [] } }

export default function Lesson({ s, d, dispatch }: { s: State; d: Derived; dispatch: React.Dispatch<Action> }) {
  const i = s.lessonStep
  const [pending, setPending] = useState<Pending | null>(null)
  const [results, setResults] = useState<Result[]>(loadResults)
  const step = i === null ? null : LESSONS[i]
  const goDirect = (n: number) => {
    if (i === null || n < 0) return
    if (n >= LESSONS.length) { dispatch({ type: 'lesson', step: null }); return }
    dispatch({ type: 'lesson', step: n, patch: Math.abs(n - i) === 1 ? LESSONS[n].patch(s) : lessonStateAt(s, n) })
  }
  const go = (n: number) => {
    if (i === null) return
    const q = LESSONS[n]?.quiz
    if (q && n === i + 1) { setPending({ step: n, guess: null }); return }
    setPending(null); goDirect(n)
  }
  const reveal = () => {
    if (i === null || !pending || pending.guess === null) return
    const target = LESSONS[pending.step]
    // same sail plan before/after: an auto sail change would mask the crew effect
    const after = derive({ ...s, ...target.patch(s), sailMode: s.sailMode === 'auto' ? d.sailModeId : s.sailMode })
    const answer = target.quiz!.answer(d, after)
    const r: Result = { step: pending.step, guess: pending.guess, answer, explain: target.quiz!.explain(d, after) }
    const next = [...results.filter((x) => x.step !== r.step), r]
    setResults(next); try { localStorage.setItem(LS, JSON.stringify(next)) } catch { /* ignore */ }
    setPending(null); goDirect(pending.step)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      if (i === null) return
      if (e.key === 'ArrowRight') { e.preventDefault(); if (pending) { if (pending.guess !== null) reveal() } else go(i + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (pending) setPending(null); else go(i - 1) }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })
  if (i === null || !step) return null
  const result = results.find((r) => r.step === i)
  const q = pending ? LESSONS[pending.step].quiz! : null
  const score = results.filter((r) => LESSONS[r.step]?.quiz && Math.abs(r.guess - r.answer) <= (LESSONS[r.step].quiz!.max - LESSONS[r.step].quiz!.min) * 0.15).length

  return (
    <div className="lesson">
      <div className="step">{pending ? `${pending.step + 1}` : i + 1} / {LESSONS.length}</div>
      <div className="body">
        {pending && q ? (
          <div className="quiz">
            <h3>Predict first</h3>
            <p>{q.question}</p>
            <div className="quiz-slider">
              <input type="range" min={q.min} max={q.max} step={q.step} value={pending.guess ?? q.min} onChange={(e) => setPending({ ...pending, guess: Number(e.target.value) })} aria-label="your guess" />
              <span className="num">{pending.guess === null ? '— slide to guess' : `${fmt(pending.guess, q.step < 1 ? 1 : 0)} ${q.unit}`}</span>
            </div>
          </div>
        ) : (
          <>
            <h3>{step.title}</h3>
            {result && step.quiz && (
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
            <button className="btn sm" onClick={() => { const n = pending.step; setPending(null); goDirect(n) }}>Skip</button>
            <button className="btn sm primary" onClick={reveal} disabled={pending.guess === null}>Reveal →</button>
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
