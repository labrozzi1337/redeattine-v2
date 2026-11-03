import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { statePolys, proj, ACTIVE, isMobile, onVisible } from './three-utils'
import { REGIONS, TOTAL_CITIES } from './data'
import { scrollTo } from './scroll'

const STEPS = REGIONS.length + 1 // 0 = visão geral, 1..9 estados, 10 = fechamento
const DUR = STEPS + 1 // uma unidade de timeline por passo
const flag = uf => `/flags/${uf}.png`

export default function BrazilMap() {
  const root = useRef(), canvas = useRef(), tip = useRef(), st = useRef(), rail = useRef()
  const [step, setStep] = useState(0)

  useEffect(() => {
    let raf, visible = true
    const el = canvas.current, mobile = isMobile()
    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75))
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b0b0f, 14, 32)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    const size = () => {
      const { clientWidth: w, clientHeight: h } = el // no mobile o canvas ocupa só a parte de cima
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    size()

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.1))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(-4, -6, 10)
    scene.add(sun)

    // Estados extrudados + bandeira sobre o topo dos estados da rede
    const meshes = [], groups = {}
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3a3b45 })
    const lineHot = new THREE.LineBasicMaterial({ color: 0xffe38a })
    const loader = new THREE.TextureLoader()
    statePolys.forEach(s => {
      const hot = ACTIVE.has(s.uf), depth = hot ? 0.16 : 0.06
      const mat = hot
        ? new THREE.MeshStandardMaterial({ color: 0xffc815, emissive: 0xff9d00, emissiveIntensity: 0.05, roughness: 0.45, metalness: 0.15 })
        : new THREE.MeshStandardMaterial({ color: 0x17181e, roughness: 0.9 })
      const g = new THREE.Group()
      const shapes = s.polys.map(p => new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y))))
      shapes.forEach(shape => {
        const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
        const m = new THREE.Mesh(geo, mat)
        m.userData = s
        g.add(m, new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), hot ? lineHot : lineMat))
        meshes.push(m)
      })
      g.userData = { mat }
      if (hot) {
        const fmat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        const fmesh = new THREE.Mesh(new THREE.ShapeGeometry(shapes), fmat)
        fmesh.position.z = depth + 0.003
        g.add(fmesh)
        g.userData.flag = fmat
        // Mapeia a bandeira como "cover" sobre a caixa do estado (UV do ShapeGeometry = x,y)
        const pts = s.polys.flat(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
        loader.load(flag(s.uf), tex => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = 4
          const a = tex.image.width / tex.image.height, w = x1 - x0, h = y1 - y0
          const [uS, vS] = w / h > a ? [w, w / a] : [h * a, h]
          tex.repeat.set(1 / uS, 1 / vS)
          tex.offset.set(-((x0 + x1) / 2 - uS / 2) / uS, -((y0 + y1) / 2 - vS / 2) / vS)
          fmat.map = tex; fmat.needsUpdate = true
        })
      }
      scene.add(g)
      groups[s.uf] = g
    })

    // Colunas de luz: uma por cidade real
    const pillarGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 6).rotateX(Math.PI / 2).translate(0, 0, 0.5)
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.9 })
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64
      const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      r.addColorStop(0, 'rgba(255,240,180,1)'); r.addColorStop(0.3, 'rgba(255,200,21,.6)'); r.addColorStop(1, 'rgba(255,200,21,0)')
      g.fillStyle = r; g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()
    const pillars = REGIONS.map(r => {
      const im = new THREE.InstancedMesh(pillarGeo, pillarMat, r.cities.length)
      const m = new THREE.Matrix4(), pos = []
      r.cities.forEach((c, i) => {
        const [x, y] = proj(c.p), h = 0.35 + Math.random() * 0.45
        pos.push(x, y, 0.16 + h)
        im.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, 0.16), new THREE.Quaternion(), new THREE.Vector3(1, 1, h)))
      })
      const group = new THREE.Group()
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      group.add(im, new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })))
      group.scale.z = 0.001
      groups[r.uf].add(group) // sobe junto com o estado
      return group
    })

    const shots = REGIONS.map(r => {
      const pts = r.cities.map(c => proj(c.p)), xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
      const cx = xs.reduce((a, b) => a + b) / xs.length, cy = ys.reduce((a, b) => a + b) / ys.length
      const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.6)
      return mobile
        ? { tx: cx, ty: cy + 0.15, d: (3.4 + spread * 2.1) * 1.4, tilt: 0.66 }
        : { tx: cx - spread * 0.35 - 0.4, ty: cy, d: 3.4 + spread * 2.1, tilt: 0.72 }
    })
    const overview = mobile ? { tx: 0.2, ty: 0.2, d: 15.5, tilt: 0.42 } : { tx: -2.6, ty: 0.4, d: 13, tilt: 0.5 }
    const cam = { ...overview }
    const look = new THREE.Vector3()
    const applyCam = t => {
      const sway = Math.sin(t * 0.25) * 0.12 // respiração leve e contínua, sem trancos
      camera.position.set(cam.tx + sway, cam.ty - Math.sin(cam.tilt) * cam.d, Math.cos(cam.tilt) * cam.d)
      camera.lookAt(look.set(cam.tx, cam.ty, 0))
    }

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const move = e => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const s = ray.intersectObjects(meshes)[0]?.object.userData
      const t = tip.current
      if (!s) { t.style.opacity = 0; return }
      const reg = REGIONS.find(x => x.uf === s.uf)
      t.innerHTML = reg
        ? `<img src="${flag(s.uf)}" alt=""><b>${s.name}</b><span>${reg.cities.length} ${reg.cities.length > 1 ? 'cidades' : 'cidade'}</span>`
        : `<b>${s.name}</b><span>próxima fronteira</span>`
      t.style.opacity = 1
      t.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', () => (tip.current.style.opacity = 0))
    addEventListener('resize', size)
    const stopVis = onVisible(el, v => (visible = v))

    const clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      const t = clock.getElapsedTime()
      pillarMat.opacity = 0.75 + Math.sin(t * 3) * 0.15
      applyCam(t)
      renderer.render(scene, camera)
    }
    tick()

    // Tour: cada passo ocupa 1 unidade; a câmera viaja em 0,7 e segura o resto.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
      tl.to({}, { duration: DUR }, 0) // fixa a duração total
      REGIONS.forEach((r, k) => {
        const i = k + 1, at = i - 0.4, g = groups[r.uf]
        tl.to(cam, { ...shots[k], duration: 0.7 }, at)
          .to(g.position, { z: 0.35, duration: 0.6 }, at + 0.1)
          .to(g.userData.mat, { emissiveIntensity: 0.6, duration: 0.6 }, at + 0.1)
          .to(g.userData.flag, { opacity: 1, duration: 0.45, ease: 'power2.out' }, at + 0.35)
          .to(pillars[k].scale, { z: 1, duration: 0.6, ease: 'expo.out' }, at + 0.4)
        if (k) {
          const p = groups[REGIONS[k - 1].uf]
          tl.to(p.position, { z: 0, duration: 0.5 }, at)
            .to(p.userData.mat, { emissiveIntensity: 0.05, duration: 0.5 }, at)
            .to(p.userData.flag, { opacity: 0, duration: 0.35 }, at)
        }
      })
      const last = groups[REGIONS.at(-1).uf], end = STEPS - 0.4
      tl.to(cam, { ...overview, duration: 0.8 }, end)
        .to(last.position, { z: 0, duration: 0.5 }, end)
        .to(last.userData.mat, { emissiveIntensity: 0.05, duration: 0.5 }, end)
      // Fechamento: todas as bandeiras juntas formam a colcha da rede
      REGIONS.forEach((r, k) => tl.to(groups[r.uf].userData.flag, { opacity: 0.92, duration: 0.4 }, end + 0.3 + k * 0.04))

      st.current = ScrollTrigger.create({
        trigger: root.current, start: 'top top', end: `+=${DUR * (mobile ? 60 : 85)}%`, pin: true, scrub: 0.6, animation: tl,
        onUpdate: self => setStep(Math.min(STEPS, Math.floor(self.progress * DUR + 0.05))),
      })
    }, root)

    return () => {
      cancelAnimationFrame(raf); stopVis(); ctx.revert()
      removeEventListener('resize', size)
      renderer.dispose()
      scene.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.() })
    }
  }, [])

  // Mantém o estado ativo visível na barra (no mobile ela rola)
  useEffect(() => {
    const r = rail.current, b = r?.children[Math.min(step, REGIONS.length) - 1]
    if (b && r.scrollWidth > r.clientWidth) r.scrollTo({ left: b.offsetLeft - r.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' })
  }, [step])

  // Vai direto ao meio do "segurar" do passo
  const go = i => { const s = st.current; s && scrollTo(s.start + ((i + 0.55) / DUR) * (s.end - s.start)) }
  const reg = step >= 1 && step <= REGIONS.length ? REGIONS[step - 1] : null

  return (
    <section className="map" id="rede" ref={root}>
      <canvas ref={canvas} className="map-canvas" aria-label="Mapa 3D do Brasil com os estados onde a Rede Attini atua" />
      <div ref={tip} className="map-tip" />
      <div className="map-panel wrap">
        <div className={`map-intro ${step === 0 ? 'on' : ''}`}>
          <p className="eyebrow">Onde atuamos</p>
          <h2 className="h2">Uma colônia que<br />atravessa o Brasil.</h2>
          <p className="lead">Role e percorra a rede, estado por estado. Cada coluna de luz é uma cidade com loja Attini.</p>
        </div>
        {REGIONS.map(r => (
          <div key={r.uf} className={`map-state ${reg === r ? 'on' : ''}`} aria-hidden={reg !== r}>
            <div className="map-id">
              <span className="map-uf">{r.uf}</span>
              <span className="map-flag"><img src={flag(r.uf)} alt={`Bandeira de ${r.name}`} /></span>
            </div>
            <h3>{r.name}</h3>
            <p className="map-count"><strong>{r.cities.length}</strong> {r.cities.length > 1 ? 'cidades' : 'cidade'} com loja Attini</p>
            <ul className="map-cities" style={{ '--cols': r.cities.length > 30 ? 3 : r.cities.length > 8 ? 2 : 1 }}>
              {r.cities.map((c, k) => <li key={c.n} style={{ '--i': k }}>{c.n}</li>)}
            </ul>
          </div>
        ))}
        <div className={`map-intro ${step === STEPS ? 'on' : ''}`}>
          <p className="eyebrow">E a colônia não para</p>
          <h2 className="h2">{TOTAL_CITIES} cidades hoje.<br />A próxima pode ser a sua.</h2>
          <div className="ctas">
            <a className="btn btn-y magnetic" href="#contato" data-tab="industria">Levar minha marca à rede</a>
            <a className="btn btn-o magnetic" href="#contato" data-tab="lojista">Abrir Attini na minha cidade</a>
          </div>
        </div>
      </div>
      <nav className="map-rail" aria-label="Estados" ref={rail}>
        {REGIONS.map((r, i) => (
          <button key={r.uf} className={reg === r ? 'on' : step > i + 1 ? 'done' : ''} onClick={() => go(i + 1)} aria-label={`${r.name}, ${r.cities.length} cidades`}>
            <img src={flag(r.uf)} alt="" />{r.uf}<small>{r.cities.length}</small>
          </button>
        ))}
      </nav>
    </section>
  )
}
