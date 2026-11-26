import { useEffect, useRef, useState } from 'react'

// Cabeçalho e rodapé únicos do site: a home e o blog usam os mesmos.
// Fica sem dependências pesadas (nada de Three.js/GSAP) para o blog carregar leve.

export const PHONE = '(63) 3142.2061'
export const WHATS = '556331422061'
export const SOCIAL = {
  instagram: 'https://www.instagram.com/redeattini/',
  facebook: 'https://www.facebook.com/redeattini',
  linkedin: 'https://br.linkedin.com/company/redeattini',
}

// Público escolhido (lojista/indústria), lembrado entre a home e o blog.
const AUD_KEY = 'attini-aud-v2'
export const readAud = () => { try { return localStorage.getItem(AUD_KEY) || 'lojista' } catch { return 'lojista' } }
export const saveAud = a => { try { localStorage.setItem(AUD_KEY, a) } catch {} }

const NAV = {
  lojista: [['#lojista', 'Benefícios'], ['#como-entrar', 'Como entrar'], ['#rede', 'Onde atuamos'], ['#conexao', 'Conexão'], ['#historias', 'Histórias']],
  industria: [['#industria', 'Por que a rede'], ['#ofertas', 'Cotas'], ['#rede', 'Onde atuamos'], ['#conexao', 'Conexão'], ['#historias', 'Histórias']],
}
const CTA = { lojista: 'Quero ser Attini', industria: 'Vender para a rede' }

// go: depois de trocar, leva o visitante ao conteúdo do público (usado no cabeçalho)
export function AudSwitch({ aud, className = '', go }) {
  return (
    <div className={`aud ${className}`} role="radiogroup" aria-label="Você é">
      <button role="radio" aria-checked={aud === 'lojista'} data-aud="lojista" data-go={go && '#lojista'}>Sou lojista</button>
      <button role="radio" aria-checked={aud === 'industria'} data-aud="industria" data-go={go && '#industria'}>Sou indústria</button>
      <i style={{ transform: `translateX(${aud === 'industria' ? 100 : 0}%)` }} />
    </div>
  )
}

// blog: as âncoras da home viram "/#secao" e o link do Blog fica marcado.
export function Header({ aud, blog }) {
  const ref = useRef()
  const [open, setOpen] = useState(false)
  const at = h => (blog ? '/' + h : h)
  const links = [...NAV[aud].map(([h, l]) => [at(h), l]), ['/blog', 'Blog']]

  useEffect(() => {
    let last = scrollY
    const h = () => {
      const y = scrollY
      ref.current.classList.toggle('hide', y > last && y > 200 && !document.documentElement.classList.contains('menu-open'))
      ref.current.classList.toggle('solid', blog || y > 40)
      last = y
    }
    h()
    addEventListener('scroll', h, { passive: true })
    return () => removeEventListener('scroll', h)
  }, [blog])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    const esc = e => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [open])

  const Links = () => links.map(([h, l]) => (
    <a key={h} href={h} aria-current={blog && h === '/blog' ? 'page' : undefined}>{l}</a>
  ))
  return (
    <header className="hdr" ref={ref}>
      <a href={blog ? '/' : '#topo'} className="hdr-logo" aria-label="Rede Attini, página inicial"><img src="/logo-attini.svg" alt="Rede Attini" width="110" height="19" /></a>
      <nav className="hdr-nav" aria-label="Seções"><Links /></nav>
      <div className="hdr-cta">
        <AudSwitch aud={aud} className="aud-sm" go />
        <a href={at('#contato')} data-tab={aud} className="btn btn-y magnetic">{CTA[aud]}</a>
        <button className="hdr-burger" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="menu-m" onClick={() => setOpen(!open)}><span /><span /></button>
      </div>
      <div className="hdr-menu" id="menu-m" onClick={e => e.target.closest('a,[data-aud]') && setOpen(false)}>
        <nav aria-label="Menu"><a href={blog ? '/' : '#topo'}>Início</a><Links /></nav>
        <AudSwitch aud={aud} go />
      </div>
    </header>
  )
}

// Logo do rodapé em partículas, como na hero, mas em Canvas 2D (o blog não carrega Three.js).
// Cada ponto é uma "formiga" que só anda DENTRO das letras (máscara do logo): sobe do pé da letra
// até o seu lugar, fica zanzando em volta dele e de vez em quando troca de lugar com uma vizinha.
// Como cada uma tem um lugar fixo, a densidade não muda e o logo continua legível.
function FooterLogo() {
  const ref = useRef()
  useEffect(() => {
    const cv = ref.current, g = cv.getContext('2d')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let ants = [], mask, raf, started = false, last = 0, W = 0, H = 0, gap = 3, mx = -1e4, my = -1e4
    const img = new Image()
    img.src = '/logo-attini.svg'
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[(y | 0) * W + (x | 0)]

    const step = (q, dt) => {
      const dx = q.hx - q.x, dy = q.hy - q.y, d = Math.hypot(dx, dy)
      if (q.climb && d < gap) q.climb = false
      let turn = Math.atan2(dy, dx) - q.a
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      // longe de casa puxa forte; perto, só zanza
      q.a += turn * (q.climb ? 0.35 : d > gap * 2 ? 0.25 : 0.04) + (Math.random() - 0.5) * 0.8
      let v = q.v * (q.climb ? 2.5 : 0.25) // sobe rápido; depois de formado, anda bem devagar
      const ex = q.x - mx, ey = q.y - my, e = Math.hypot(ex, ey), R = W * 0.05
      if (e < R) { q.a = Math.atan2(ey, ex) + (Math.random() - 0.5); v *= 3 } // foge do mouse
      const nx = q.x + Math.cos(q.a) * v * dt, ny = q.y + Math.sin(q.a) * v * dt
      if (inside(nx, ny)) { q.x = nx; q.y = ny } else q.a += Math.PI * (0.5 + Math.random()) // bateu na borda da letra
    }
    // troca de lugar com uma vizinha próxima (mesma letra, quase sempre): a obra nunca para
    const swap = () => {
      const i = (Math.random() * ants.length) | 0, j = i + 1 + ((Math.random() * 6) | 0), p = ants[i], q = ants[j]
      if (!q || Math.hypot(p.hx - q.hx, p.hy - q.hy) > gap * 8) return
      ;[p.hx, q.hx] = [q.hx, p.hx]; [p.hy, q.hy] = [q.hy, p.hy]
    }

    const build = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      W = cv.clientWidth; H = cv.clientHeight
      if (!W) return
      cv.width = W * dpr; cv.height = H * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      const o = document.createElement('canvas')
      o.width = W; o.height = H
      const og = o.getContext('2d', { willReadFrequently: true })
      og.drawImage(img, 0, 0, W, H)
      const d = og.getImageData(0, 0, W, H).data
      mask = new Uint8Array(W * H)
      for (let i = 0; i < mask.length; i++) mask[i] = d[i * 4 + 3] > 128
      gap = Math.max(2.5, W / 420)
      const r = gap * 0.42
      ants = []
      for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
        const hx = x + (Math.random() - 0.5) * gap * 0.8, hy = y + (Math.random() - 0.5) * gap * 0.8
        if (!inside(hx, hy)) continue
        let by = hy // começa no pé da letra, na mesma coluna: a subida é toda por dentro
        while (inside(hx, by + 1)) by++
        const q = { hx, hy, x: hx, y: still ? hy : by - Math.random() * gap, a: -Math.PI / 2, v: (W / 1400) * (0.4 + Math.random() * 0.5), r: r * (0.7 + Math.random() * 0.6), climb: !still }
        ants.push(q)
      }
      paint()
    }

    const paint = () => {
      g.clearRect(0, 0, W, H)
      g.beginPath()
      for (const q of ants) { g.moveTo(q.x + q.r, q.y); g.arc(q.x, q.y, q.r, 0, 6.2832) }
      g.fillStyle = '#111'
      g.fill()
    }
    const frame = now => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(Math.max(now - last, 0) / 16.7, 3)
      last = now
      if (!started) return
      for (const q of ants) step(q, dt)
      for (let k = ants.length / 1600; k > 0; k--) swap() // cada formiga troca de lugar a cada ~25 s
      paint()
    }

    const move = e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top }
    const ro = new ResizeObserver(build)
    // A obra começa quando o rodapé está bem à vista; fora da tela, nada roda.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (!e.isIntersecting || still) return
      if (e.intersectionRatio >= 0.4) started = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }, { threshold: [0, 0.4] })
    img.decode().then(() => { ro.observe(cv); io.observe(cv) }).catch(() => {})
    addEventListener('pointermove', move)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', move) }
  }, [])
  return <canvas ref={ref} role="img" aria-label="Rede Attini" />
}

export function Footer({ blog }) {
  const at = h => (blog ? '/' + h : h)
  return (
    <>
      <footer className="ft">
        <div className="ft-giant"><FooterLogo /></div>
        <div className="wrap ft-row">
          <p>Construir é tornar real tudo aquilo que é sonho.</p>
          <nav className="ft-links" aria-label="Rodapé">
            <a href={blog ? '/' : '#topo'}>Início</a>
            <a href={at('#rede')}>Onde atuamos</a>
            <a href="/blog">Blog</a>
            <a href={at('#contato')}>Fale conosco</a>
          </nav>
          <div className="ft-links">
            <a href={`tel:+${WHATS}`}>{PHONE}</a>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener">Instagram</a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener">LinkedIn</a>
            <a href={SOCIAL.facebook} target="_blank" rel="noopener">Facebook</a>
          </div>
          <p className="ft-copy">© {new Date().getFullYear()} Rede Attini</p>
        </div>
      </footer>
      <a className="wa" href={`https://wa.me/${WHATS}?text=${encodeURIComponent('Olá, visitei o site Attini e gostaria de informações')}`} target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.4-.9-2.8-1.2-4.6-4.1-4.8-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.2 1.3Z" /></svg>
      </a>
    </>
  )
}
