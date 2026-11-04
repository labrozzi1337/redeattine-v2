import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sampleBrazil, isMobile, onVisible, reducedMotion } from './three-utils'
import { TOTAL_CITIES, STORES, AREA } from './data'

const vert = /* glsl */ `
uniform float uTime, uIntro, uMorph, uSize, uPR;
uniform vec2 uMouse;
attribute vec3 aA, aB, aR;
varying float vHot, vAlpha;
void main() {
  vec3 start = (aR - .5) * vec3(26., 16., 10.);
  vec3 p = mix(start, vec3(aA.xy, 0.), smoothstep(aR.y * .45, aR.y * .45 + .55, uIntro));
  float d = aR.x * .35;
  float m = smoothstep(d, d + .65, uMorph);
  p = mix(p, vec3(aB.xy, 0.), m);
  p.z += sin(m * 3.1416) * (aR.z * 4. - 2.);
  float t = uTime * (.5 + aR.x);
  p.xy += vec2(sin(t + aR.y * 40.), cos(t * 1.3 + aR.z * 40.)) * .022;
  vec2 dm = p.xy - uMouse;
  p.xy += normalize(dm + 1e-4) * smoothstep(1.3, 0., length(dm)) * .55;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPR * (.55 + aR.z * .9) / -mv.z;
  vHot = mix(1., aB.z, m);
  vAlpha = .45 + aR.y * .55;
}`
const frag = /* glsl */ `
varying float vHot, vAlpha;
void main() {
  float r = length(gl_PointCoord - .5);
  if (r > .5) discard;
  vec3 c = mix(vec3(.55, .56, .62), vec3(1., .784, .082), vHot);
  gl_FragColor = vec4(c, vAlpha * smoothstep(.5, .15, r) * mix(.8, 1., vHot));
}`

function sampleText(n, width) {
  const c = document.createElement('canvas'), W = 1200, H = 300
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.font = '800 270px Sora, sans-serif'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText('ATTINI', W / 2, H / 2 + 10)
  const data = g.getImageData(0, 0, W, H).data, pts = []
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y])
  const s = width / W
  return Array.from({ length: n }, () => { const [x, y] = pts[(Math.random() * pts.length) | 0]; return [(x - W / 2) * s, -(y - H / 2) * s] })
}

const COPY = {
  lojista: {
    eyebrow: 'Para o lojista de material de construção',
    l1: 'Sua loja, com a força', l2: ['de uma ', 'rede inteira.'],
    sub: `Compre direto da indústria com tabela exclusiva, tenha gestão de quem entende do setor e ${STORES} lojas do seu lado. A loja continua sua.`,
    cta: [['#contato', 'Quero ser Attini', 'lojista'], ['#lojista', 'Ver benefícios', null]],
  },
  industria: {
    eyebrow: 'Para a indústria de material de construção',
    l1: 'Sozinha, uma loja compra.', l2: ['Em rede, ela ', 'move o mercado.'],
    sub: `${STORES} lojas em ${TOTAL_CITIES} cidades e uma única mesa de negociação. Venda para a rede inteira, não loja por loja.`,
    cta: [['#industria', 'Ver o que a rede oferece', null], ['#contato', 'Falar com o comercial', 'industria']],
  },
}

// go: depois de trocar, leva o visitante ao conteúdo do público (usado no header)
export function AudSwitch({ aud, className = '', go }) {
  return (
    <div className={`aud ${className}`} role="radiogroup" aria-label="Você é">
      <button role="radio" aria-checked={aud === 'lojista'} data-aud="lojista" data-go={go && '#lojista'}>Sou lojista</button>
      <button role="radio" aria-checked={aud === 'industria'} data-aud="industria" data-go={go && '#industria'}>Sou indústria</button>
      <i style={{ transform: `translateX(${aud === 'industria' ? 100 : 0}%)` }} />
    </div>
  )
}

export default function Hero({ aud }) {
  const root = useRef(), canvas = useRef(), first = useRef(true)
  const c = COPY[aud]

  // Troca de público: o título sobe de novo
  useEffect(() => {
    if (first.current) { first.current = false; return }
    gsap.fromTo('.hero-title .line > span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
    gsap.fromTo('.hero-sub-a, .hero-a .ctas', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06 })
  }, [aud])

  useEffect(() => {
    let raf, visible = true, disposed = false
    const el = canvas.current
    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: false, alpha: true })
    const pr = Math.min(devicePixelRatio, 1.75)
    renderer.setPixelRatio(pr)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 10
    const size = () => {
      const { clientWidth: w, clientHeight: h } = el.parentElement
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    size()

    const mobile = isMobile()
    const N = mobile ? 4000 : 11000
    const visH = 2 * 10 * Math.tan((22.5 * Math.PI) / 180), visW = visH * camera.aspect
    const uniforms = {
      uTime: { value: 0 }, uIntro: { value: reducedMotion() ? 1 : 0 }, uMorph: { value: 0 },
      uSize: { value: mobile ? 22 : 30 }, uPR: { value: pr }, uMouse: { value: new THREE.Vector2(99, 99) },
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3))
    let points

    document.fonts.load('800 100px Sora').finally(() => {
      if (disposed) return
      // Mobile: palavra e mapa ficam no terço de cima; o texto ocupa a metade de baixo
      const textW = mobile ? visW * 0.9 : Math.min(visW * 0.86, visH * 1.35, 13)
      const txt = sampleText(N, textW)
      const br = sampleBrazil(N)
      const sB = mobile ? Math.min((visH * 0.48) / 8.6, (visW * 0.9) / 8.5) : Math.min((visH * 0.82) / 8.6, (visW * 0.5) / 8.5)
      const offX = mobile ? 0 : visW * 0.2
      const yA = visH * (mobile ? 0.15 : 0.22)
      const offY = mobile ? visH * 0.2 : 0
      const A = new Float32Array(N * 3), B = new Float32Array(N * 3), R = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        A.set([txt[i][0], txt[i][1] + yA, 0], i * 3)
        const b = br[i % br.length]
        B.set([b[0] * sB + offX, b[1] * sB + offY, b[2]], i * 3)
        R.set([Math.random(), Math.random(), Math.random()], i * 3)
      }
      geom.setAttribute('aA', new THREE.BufferAttribute(A, 3))
      geom.setAttribute('aB', new THREE.BufferAttribute(B, 3))
      geom.setAttribute('aR', new THREE.BufferAttribute(R, 3))
      points = new THREE.Points(geom, mat)
      points.frustumCulled = false
      scene.add(points)
      if (!reducedMotion()) gsap.to(uniforms.uIntro, { value: 1, duration: 3.2, ease: 'power3.out', delay: 1.7 })
    })

    const mouse = e => {
      const r = el.getBoundingClientRect()
      uniforms.uMouse.value.set(((e.clientX - r.left) / r.width - 0.5) * visW, -((e.clientY - r.top) / r.height - 0.5) * visH)
    }
    addEventListener('pointermove', mouse)
    addEventListener('resize', size)
    const stopVis = onVisible(el, v => (visible = v))

    const clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      uniforms.uTime.value = clock.getElapsedTime()
      if (points) points.rotation.y = Math.sin(uniforms.uTime.value * 0.15) * 0.08 * (1 - uniforms.uMorph.value)
      renderer.render(scene, camera)
    }
    tick()

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      tl.to(uniforms.uMorph, { value: 1, duration: 1, ease: 'none' }, 0.15)
        .to('.hero-a', { autoAlpha: 0, y: -60, duration: 0.25 }, 0)
        .fromTo('.hero-b', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.75)
        .to('.hero-scroll', { autoAlpha: 0, duration: 0.1 }, 0)
    }, root)

    return () => {
      disposed = true
      cancelAnimationFrame(raf); stopVis(); ctx.revert()
      removeEventListener('pointermove', mouse); removeEventListener('resize', size)
      geom.dispose(); mat.dispose(); renderer.dispose()
    }
  }, [])

  return (
    <section className="hero" ref={root} id="topo">
      <div className="hero-sticky">
        <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
        <div className="hero-a wrap">
          <div className="reveal-up hero-switch"><AudSwitch aud={aud} /></div>
          <p className="eyebrow reveal-up">{c.eyebrow}</p>
          <h1 className="hero-title">
            <span className="line"><span>{c.l1}</span></span>
            <span className="line"><span>{c.l2[0]}<em>{c.l2[1]}</em></span></span>
          </h1>
          <div className="hero-foot">
            <p className="hero-sub hero-sub-a reveal-up">{c.sub}</p>
            <div className="ctas reveal-up">
              {c.cta.map(([href, label, tab], k) => (
                <a key={label} className={`btn ${k ? 'btn-o' : 'btn-y'} magnetic`} href={href} {...(tab && { 'data-tab': tab })}>{label}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-b wrap">
          <p className="eyebrow">Onde a rede está</p>
          <p className="hero-b-big"><strong>{STORES}</strong> lojas.<br /><strong>{TOTAL_CITIES}</strong> cidades.<br />Uma só rede.</p>
          <p className="hero-sub">Em amarelo, os {AREA} onde a Attini já está. A maior parte das lojas fica longe das capitais, onde o grande varejo não chega e o lojista local decide o que vende.</p>
        </div>
        <div className="hero-scroll" aria-hidden="true"><span />role para ver a rede</div>
      </div>
    </section>
  )
}
