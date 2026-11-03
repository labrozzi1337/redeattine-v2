import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const lenis = new Lenis({ lerp: 0.1, smoothWheel: !matchMedia('(prefers-reduced-motion: reduce)').matches })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(t => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)

// Seções fixadas (pin) medem 0 no topo enquanto presas; mede pelo spacer.
const yOf = sel => {
  const el = document.querySelector(sel)
  if (!el) return scrollY
  const box = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el
  return box.getBoundingClientRect().top + scrollY
}

// Saltos longos atravessariam o tour do mapa em alta velocidade; usa uma cortina.
export function scrollTo(target, { offset = 0 } = {}) {
  const y = (typeof target === 'number' ? target : yOf(target)) + offset
  if (Math.abs(y - scrollY) < innerHeight * 2.5) return lenis.scrollTo(y, { duration: 1.3 })
  const c = document.querySelector('.curtain')
  gsap.timeline()
    .set(c, { yPercent: 100, autoAlpha: 1 })
    .to(c, { yPercent: 0, duration: 0.55, ease: 'expo.in' })
    .add(() => lenis.scrollTo(y, { immediate: true, force: true }))
    .to(c, { yPercent: -100, duration: 0.75, ease: 'expo.out', delay: 0.12 })
    .set(c, { autoAlpha: 0 })
}
