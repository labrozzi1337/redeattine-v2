import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { statePolys, proj, ACTIVE, isMobile, onVisible } from './three-utils'
import { REGIONS, TOTAL_CITIES, STORES, AREA } from './data'

const flag = uf => `/flags/${uf}.png`
const plural = n => `${n} ${n > 1 ? 'cidades' : 'cidade'}`
// Lojas primeiro, depois cidades (quando a Attini informar as lojas do estado em data.js)
const count = r => (r.stores ? `${r.stores} ${r.stores > 1 ? 'lojas' : 'loja'} em ` : '') + plural(r.cities.length)
const allStores = REGIONS.every(r => r.stores)

// Mapa direto: abre com a rede inteira; o visitante escolhe o estado na barra ou clicando no mapa.
export default function BrazilMap() {
  const root = useRef(), canvas = useRef(), tip = useRef(), rail = useRef(), focus = useRef()
  const [sel, setSel] = useState(null)

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

    // Visão geral: todos os estados da rede acesos. Estado escolhido: sobe, acende e mostra a bandeira.
    focus.current = uf => {
      const k = REGIONS.findIndex(r => r.uf === uf)
      gsap.to(cam, { ...(k < 0 ? overview : shots[k]), duration: 1.4, ease: 'power3.inOut', overwrite: true })
      REGIONS.forEach((r, i) => {
        const g = groups[r.uf], on = i === k, all = k < 0
        gsap.to(g.position, { z: on ? 0.35 : 0, duration: 0.9, ease: 'power3.inOut', overwrite: true })
        gsap.to(g.userData.mat, { emissiveIntensity: on ? 0.6 : all ? 0.25 : 0.03, duration: 0.9, overwrite: true })
        gsap.to(g.userData.flag, { opacity: on ? 1 : 0, duration: 0.5, overwrite: true })
      })
    }

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const hit = e => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.intersectObjects(meshes)[0]?.object.userData
    }
    const move = e => {
      const s = hit(e), t = tip.current, r = el.getBoundingClientRect()
      const reg = s && REGIONS.find(x => x.uf === s.uf)
      el.style.cursor = reg ? 'pointer' : ''
      if (!s) { t.style.opacity = 0; return }
      t.innerHTML = reg
        ? `<img src="${flag(s.uf)}" alt=""><b>${s.name}</b><span>${count(reg)} · clique para ver</span>`
        : `<b>${s.name}</b><span>próxima fronteira</span>`
      t.style.opacity = 1
      t.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`
    }
    const click = e => { const s = hit(e); if (s && ACTIVE.has(s.uf)) setSel(s.uf) }
    el.addEventListener('pointermove', move)
    el.addEventListener('click', click)
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

    // Entrada: as cidades acendem estado por estado quando o mapa aparece
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 60%', once: true } })
      REGIONS.forEach((r, k) => {
        tl.to(groups[r.uf].userData.mat, { emissiveIntensity: 0.25, duration: 0.5 }, k * 0.12)
          .to(pillars[k].scale, { z: 1, duration: 0.8, ease: 'expo.out' }, k * 0.12)
      })
    }, root)

    return () => {
      cancelAnimationFrame(raf); stopVis(); ctx.revert()
      removeEventListener('resize', size)
      renderer.dispose()
      scene.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.() })
    }
  }, [])

  useEffect(() => {
    focus.current?.(sel)
    // Mantém o estado ativo visível na barra (no mobile ela rola)
    const r = rail.current, b = r?.querySelector('.on')
    if (b && r.scrollWidth > r.clientWidth) r.scrollTo({ left: b.offsetLeft - r.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' })
  }, [sel])

  const reg = REGIONS.find(r => r.uf === sel)

  return (
    <section className="map" id="rede" ref={root}>
      <canvas ref={canvas} className="map-canvas" aria-label="Mapa 3D do Brasil com os estados onde a Rede Attini atua" />
      <div ref={tip} className="map-tip" />
      <div className="map-panel wrap">
        <div className={`map-intro ${!reg ? 'on' : ''}`} aria-hidden={!!reg}>
          <p className="eyebrow">Onde atuamos</p>
          <h2 className="h2">Uma rede que<br />atravessa o Brasil.</h2>
          <p className="lead"><b>{STORES} lojas</b> em <b>{TOTAL_CITIES} cidades</b> de {AREA}. Escolha um estado para ver as cidades.</p>
        </div>
        {REGIONS.map(r => (
          <div key={r.uf} className={`map-state ${reg === r ? 'on' : ''}`} aria-hidden={reg !== r}>
            <button className="map-back" onClick={() => setSel(null)} tabIndex={reg === r ? 0 : -1}>← Toda a rede</button>
            <div className="map-id">
              <span className="map-uf">{r.uf}</span>
              <span className="map-flag"><img src={flag(r.uf)} alt={`Bandeira: ${r.name}`} /></span>
            </div>
            <h3>{r.name}</h3>
            <p className="map-count">{r.stores > 0 && <><strong>{r.stores}</strong> {r.stores > 1 ? 'lojas' : 'loja'} em </>}<strong>{r.cities.length}</strong> {r.cities.length > 1 ? 'cidades' : 'cidade'}{!r.stores && ' com loja Attini'}</p>
            <ul className="map-cities" data-lenis-prevent style={{ '--cols': r.cities.length > 30 ? 3 : r.cities.length > 8 ? 2 : 1 }}>
              {r.cities.map((c, k) => <li key={c.n} style={{ '--i': Math.min(k, 40) }}>{c.n}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <nav className="map-rail" aria-label="Escolha o estado" ref={rail}>
        <button className={!reg ? 'on' : ''} aria-pressed={!reg} onClick={() => setSel(null)}>Toda a rede<small>{allStores ? `${STORES} lojas` : TOTAL_CITIES}</small></button>
        {REGIONS.map(r => (
          <button key={r.uf} className={reg === r ? 'on' : ''} aria-pressed={reg === r} onClick={() => setSel(r.uf)} aria-label={`${r.name}, ${count(r)}`}>
            <img src={flag(r.uf)} alt="" />{r.uf}<small>{allStores ? r.stores : r.cities.length}</small>
          </button>
        ))}
      </nav>
    </section>
  )
}
