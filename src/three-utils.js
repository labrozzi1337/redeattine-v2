import * as THREE from 'three'
import geo from './geo.json'

export const YELLOW = new THREE.Color('#FFC815')
export const ACTIVE = new Set(geo.cities.map(c => c.uf))

// Equirretangular simples centrado no Brasil; corrige o achatamento pela latitude média.
const K = 0.22, LON0 = -52, LAT0 = -14, COS = Math.cos((LAT0 * Math.PI) / 180)
export const proj = ([lon, lat]) => [(lon - LON0) * K * COS, (lat - LAT0) * K]

export function inPoly(x, y, poly) {
  let ins = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins
  }
  return ins
}

export const statePolys = geo.states.map(s => ({ ...s, polys: s.polys.map(p => p.map(proj)) }))

// Pontos aleatórios dentro do Brasil; estados da rede recebem densidade maior.
export function sampleBrazil(n) {
  const area = s => s.polys.reduce((a, p) => a + Math.abs(p.reduce((s2, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s2 + x * y2 - x2 * y }, 0) / 2), 0)
  const w = statePolys.map(s => area(s) * (ACTIVE.has(s.uf) ? 4 : 1))
  const tot = w.reduce((a, b) => a + b)
  const out = []
  statePolys.forEach((s, i) => {
    const want = Math.round((w[i] / tot) * n)
    const pts = s.polys.flat(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    for (let k = 0, guard = 0; k < want && guard < want * 60; guard++) {
      const x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0)
      if (s.polys.some(p => inPoly(x, y, p))) { out.push([x, y, ACTIVE.has(s.uf) ? 1 : 0]); k++ }
    }
  })
  return out
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
export const isMobile = () => matchMedia('(max-width: 760px)').matches

// Só renderiza quando o canvas está na tela.
export function onVisible(el, cb) {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '100px' })
  io.observe(el)
  return () => io.disconnect()
}
