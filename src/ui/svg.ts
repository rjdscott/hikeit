import { useEffect, useRef, useState } from 'react'

/** Linear scale factory. */
export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)

export function linePath(xs: number[], ys: number[], sx: (v: number) => number, sy: (v: number) => number): string {
  let d = ''
  for (let i = 0; i < xs.length; i++) d += (i ? 'L' : 'M') + sx(xs[i]).toFixed(1) + ',' + sy(ys[i]).toFixed(1)
  return d
}

/** "Nice" tick values covering [lo, hi] with ~n ticks. */
export function niceTicks(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo || 1
  const raw = span / n
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n + 1) ?? mag * 10
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10))
  return out
}

/** Observe the pixel width of an element. */
export function useWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((es) => setW(Math.max(200, es[0].contentRect.width)))
    ro.observe(el)
    setW(Math.max(200, el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Convert a pointer event to the local coordinate system of an SVG element/group. */
export function svgPoint(el: SVGGraphicsElement, e: { clientX: number; clientY: number }) {
  const m = el.getScreenCTM()
  if (!m) return { x: 0, y: 0 }
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
  return { x: p.x, y: p.y }
}

export const fmt = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '–')
export const kNm = (v: number, d = 1) => fmt(v / 1e3, d)
