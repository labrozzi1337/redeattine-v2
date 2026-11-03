import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis, scrollTo } from './scroll'
import Hero, { AudSwitch } from './Hero'
import BrazilMap from './BrazilMap'
import Offers from './Offers'
import LeadForm from './LeadForm'
import Blog from './Blog'
import { STATS, INDUSTRY, RETAIL, BRANDS, PHONE, WHATS, SOCIAL, TOTAL_CITIES, REGIONS } from './data'

const MANIFESTO = 'Attini é o nome de uma tribo de formigas que cultiva o próprio alimento e ergue colônias com milhões de indivíduos. Nenhuma carrega o peso sozinha. A rede funciona igual: cada loja põe a sua força, e o volume de todas negocia por cada uma.'
const TICKER = ['Compra conjunta', 'Trade marketing', 'Conexão Attini', 'Festival de Prêmios', 'Lojista Protagonista', `${TOTAL_CITIES} cidades`]

const readAud = () => { try { return localStorage.getItem('attini-aud') || 'industria' } catch { return 'industria' } }

function Preloader({ onDone }) {
  const ref = useRef(), num = useRef()
  useEffect(() => {
    const o = { v: 0 }
    const tl = gsap.timeline({ onComplete: onDone })
    tl.to(o, { v: TOTAL_CITIES, duration: 1.4, ease: 'power2.inOut', onUpdate: () => (num.current.textContent = Math.round(o.v)) })
      .to('.pre-bar i', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(ref.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.15')
    return () => tl.kill()
  }, [])
  return (
    <div className="pre" ref={ref} aria-hidden="true">
      <img src="/logo-attini.png" alt="" />
      <div className="pre-num"><span ref={num}>0</span><small>cidades conectadas</small></div>
      <div className="pre-bar"><i /></div>
    </div>
  )
}

function Header({ aud }) {
  const ref = useRef()
  useEffect(() => {
    const h = ({ direction, scroll }) => {
      ref.current.classList.toggle('hide', direction === 1 && scroll > 200)
      ref.current.classList.toggle('solid', scroll > 40)
    }
    lenis.on('scroll', h)
    return () => lenis.off('scroll', h)
  }, [])
  return (
    <header className="hdr" ref={ref}>
      <a href="#topo" className="hdr-logo" aria-label="Rede Attini, voltar ao topo"><img src="/logo-attini.png" alt="Rede Attini" width="110" height="26" /></a>
      <nav className="hdr-nav" aria-label="Seções">
        <a href="#ofertas">Para a indústria</a>
        <a href="#rede">Onde atuamos</a>
        <a href="#conexao">Conexão</a>
        <a href="#lojista">Para o lojista</a>
        <a href="#blog">Blog</a>
      </nav>
      <div className="hdr-cta">
        <AudSwitch aud={aud} className="aud-sm" />
        {aud === 'industria'
          ? <a href="#contato" data-tab="industria" className="btn btn-y magnetic">Vender para a rede</a>
          : <a href="#contato" data-tab="lojista" className="btn btn-y magnetic">Quero ser Attini</a>}
      </div>
    </header>
  )
}

const Lines = ({ children, as: T = 'h2', className = 'h2' }) => (
  <T className={`${className} split`}>{children.split('\n').map((l, i) => <span className="line" key={i}><span>{l}</span></span>)}</T>
)

export default function App() {
  const [ready, setReady] = useState(false)
  const [aud, setAud] = useState(readAud)
  const [preset, setPreset] = useState(null)

  useEffect(() => { try { localStorage.setItem('attini-aud', aud) } catch {} }, [aud])

  // Qualquer elemento com data-aud/data-tab escolhe o público; data-interest pré-marca no formulário
  useEffect(() => {
    const h = e => {
      const t = e.target.closest('[data-aud],[data-tab]')
      if (!t) return
      setAud(t.dataset.aud || t.dataset.tab)
      if (t.dataset.interest) setPreset({ v: t.dataset.interest, n: Date.now() })
    }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!ready) { lenis.stop(); return }
    lenis.start()

    const ctx = gsap.context(() => {
      gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
      gsap.from('.hero-a .reveal-up, .hdr', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.3 })

      gsap.utils.toArray('.split').forEach(el => !el.closest('.hero') && gsap.from(el.querySelectorAll('.line > span'), {
        yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%' },
      }))
      gsap.utils.toArray('.reveal-up').forEach(el => !el.closest('.hero') && gsap.from(el, {
        y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' },
      }))
      // Imagens: abrem com máscara e fazem parallax
      gsap.utils.toArray('.reveal-img').forEach(el => {
        gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0 round 28px)' }, { clipPath: 'inset(0% 0 0 0 round 28px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
        const img = el.querySelector('img')
        img && gsap.fromTo(img, { yPercent: -8, scale: 1.15 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      gsap.to('.manifesto .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto-txt', start: 'top 75%', end: 'bottom 55%', scrub: true } })

      gsap.utils.toArray('.stat-n').forEach(el => {
        const o = { v: 0 }, end = +el.dataset.v
        gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onUpdate: () => (el.textContent = Math.round(o.v)) })
      })

      gsap.from('.door', { y: 100, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.doors', start: 'top 80%' } })

      const track = document.querySelector('.ind-track')
      gsap.matchMedia().add('(min-width: 900px)', () => {
        gsap.to(track, {
          x: () => -(track.scrollWidth - innerWidth + 40), ease: 'none',
          scrollTrigger: { trigger: '.industry', start: 'top top', end: () => '+=' + track.scrollWidth, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        })
      })

      gsap.fromTo('.cx-media', { clipPath: 'inset(18% 22% 18% 22% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.conexao', start: 'top bottom', end: 'center center', scrub: true } })
      gsap.fromTo('.cx-big', { xPercent: 10 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.conexao', start: 'top bottom', end: 'bottom top', scrub: true } })

      gsap.from('.ft-giant span', { yPercent: 100, stagger: 0.05, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ft', start: 'top 70%' } })
    })

    const anchors = e => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      e.preventDefault()
      scrollTo(a.getAttribute('href'), { offset: a.getAttribute('href') === '#contato' ? -40 : 0 })
    }
    document.addEventListener('click', anchors)

    const fine = matchMedia('(pointer: fine)').matches && !reduce
    let off = () => {}
    if (fine) {
      const cur = document.querySelector('.cursor'), lab = cur.querySelector('span')
      const x = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), y = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' })
      let last
      const move = e => {
        x(e.clientX); y(e.clientY)
        const t = e.target.closest('a,button,[data-cursor]')
        cur.classList.toggle('big', !!t)
        lab.textContent = t?.dataset.cursor || ''
        const m = e.target.closest('.magnetic')
        if (last && last !== m) gsap.to(last, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,.4)' })
        last = m
        if (m) {
          const r = m.getBoundingClientRect()
          gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4 })
        }
      }
      addEventListener('pointermove', move)
      off = () => removeEventListener('pointermove', move)
    }
    const refresh = () => ScrollTrigger.refresh()
    addEventListener('load', refresh)
    document.fonts.ready.then(refresh)

    return () => { ctx.revert(); document.removeEventListener('click', anchors); off(); removeEventListener('load', refresh) }
  }, [ready])

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      <div className="curtain" aria-hidden="true"><img src="/logo-attini.png" alt="" /></div>
      <div className="cursor" aria-hidden="true"><span /></div>
      <div className="grain" aria-hidden="true" />
      <Header aud={aud} />
      <main>
        <Hero aud={aud} />

        <div className="ticker" aria-hidden="true">
          <div className="ticker-in">{[...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}<b>✦</b></span>)}</div>
        </div>

        <section className="manifesto wrap" aria-label="Origem do nome">
          <div>
            <p className="eyebrow">Por que Attini</p>
            <p className="manifesto-txt">{MANIFESTO.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}</p>
          </div>
          <figure className="manifesto-img reveal-img">
            <img src="/img/origem.jpg" alt="Formiga cortadeira carregando uma folha muitas vezes maior que ela" loading="lazy" />
            <figcaption>Uma formiga carrega muitas vezes o próprio peso. A colônia move o terreno.</figcaption>
          </figure>
        </section>

        <section className="stats wrap" aria-label="A rede em números">
          {STATS.map(s => (
            <div className="stat reveal-up" key={s.label}>
              <p className="stat-v">{s.prefix}<span className="stat-n" data-v={s.value}>{s.value}</span>{s.suffix}</p>
              <p className="stat-l">{s.label}</p>
              <p className="stat-note">{s.note}</p>
            </div>
          ))}
        </section>

        <section className="doors wrap" aria-label="Escolha o seu caminho">
          <a href="#ofertas" data-aud="industria" className={`door door-ind ${aud === 'industria' ? 'pick' : ''}`} data-cursor="Entrar">
            <img src="/img/ai/caminhao.webp" alt="" loading="lazy" />
            <div className="door-c">
              <p className="eyebrow">Sou indústria</p>
              <h3>Venda para {TOTAL_CITIES} cidades com uma negociação.</h3>
              <ul><li>Tabela única para toda a rede</li><li>Trade marketing executado nas lojas</li><li>Acesso direto ao dono do balcão</li></ul>
              <span className="door-go">Ver o que a rede oferece <b>→</b></span>
            </div>
          </a>
          <a href="#lojista" data-aud="lojista" className={`door door-loj ${aud === 'lojista' ? 'pick' : ''}`} data-cursor="Entrar">
            <div className="door-photo"><img src="/img/quem-somos.webp" alt="" loading="lazy" /></div>
            <div className="door-c">
              <p className="eyebrow">Sou lojista</p>
              <h3>Preço de gigante, sem deixar de ser dono.</h3>
              <ul><li>Compra direta com a indústria</li><li>Gestão e assessoria do setor</li><li>Lojistas de {REGIONS.length} estados do seu lado</li></ul>
              <span className="door-go">Ver benefícios <b>→</b></span>
            </div>
          </a>
        </section>

        <BrazilMap />

        <section className="industry" id="industria">
          <div className="ind-head wrap">
            <p className="eyebrow">Por que vender pela rede</p>
            <Lines>{'Uma porta.\n' + TOTAL_CITIES + ' cidades.'}</Lines>
            <p className="lead">O que a sua marca ganha quando vende para a colônia, e não loja por loja.</p>
          </div>
          <div className="ind-track">
            {INDUSTRY.map(c => (
              <article className="ind-card" key={c.n}>
                <div className="ind-img"><img src={c.img} alt="" loading="lazy" /></div>
                <span className="ind-n">{c.n}</span>
                <h3>{c.t.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</h3>
                <p>{c.d}</p>
              </article>
            ))}
            <article className="ind-card ind-cta">
              <h3>Quer ver o tamanho da rede na sua categoria?</h3>
              <a href="#contato" data-tab="industria" className="btn btn-dark magnetic">Falar com o comercial →</a>
            </article>
          </div>
        </section>

        <Offers />

        <section className="conexao" id="conexao">
          <div className="cx-big" aria-hidden="true">CONEXÃO ATTINI · CONEXÃO ATTINI ·</div>
          <div className="cx-media">
            <img src="/img/conexao.webp" alt="Aperto de mão sob a marca Conexão Attini, o evento de negócios da rede" loading="lazy" />
          </div>
          <div className="cx-copy wrap">
            <p className="eyebrow">O evento da rede</p>
            <Lines>{'Milhões em pedidos\nem poucas horas.'}</Lines>
            <p className="lead reveal-up">O Conexão Attini coloca a sua equipe comercial frente a frente com lojistas que decidem a compra na hora. Para o lojista, é o dia de comprar com a melhor condição do ano. A 4ª edição já tem data marcada.</p>
            <div className="ctas reveal-up">
              <a href="#contato" data-tab="industria" data-interest="Cota Conexão Attini" className="btn btn-y magnetic">Garantir a cota da minha marca</a>
              <a href="#contato" data-tab="lojista" className="btn btn-o magnetic">Quero participar como lojista</a>
            </div>
          </div>
        </section>

        <section className="brands" aria-labelledby="brands-t">
          <div className="wrap"><p className="eyebrow" id="brands-t">Quem já vende pela rede</p></div>
          {[0, 1].map(row => (
            <div className={`brands-row ${row ? 'rev' : ''}`} key={row}>
              <div className="brands-in">
                {[...BRANDS.filter((_, i) => i % 2 === row), ...BRANDS.filter((_, i) => i % 2 === row)].map((b, i) => (
                  <figure key={i} className="brand"><img src={b.src} alt={b.name} loading="lazy" /></figure>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="retail wrap" id="lojista">
          <div className="retail-top">
            <div className="retail-head">
              <p className="eyebrow">Para o lojista</p>
              <Lines>{'Preço de gigante,\nsem deixar de ser dono.'}</Lines>
              <p className="lead reveal-up">Sua loja continua com o seu nome, o seu jeito e o seu cliente. A rede entra com o que uma loja sozinha não consegue: volume, método e gente para trocar ideia.</p>
              <a href="#contato" data-tab="lojista" className="btn btn-y magnetic reveal-up">Quero ser Attini</a>
            </div>
            <figure className="retail-photo reveal-up">
              <img src="/img/quem-somos.webp" alt="Lojista associado da Rede Attini em sua loja de material de construção" loading="lazy" />
              <figcaption><b>{TOTAL_CITIES}</b> cidades com loja Attini</figcaption>
            </figure>
          </div>
          <div className="retail-grid">
            {RETAIL.map(([t, items], i) => (
              <div className="retail-col reveal-up" key={t}>
                <span className="retail-i">{String(i + 1).padStart(2, '0')}</span>
                <h3>{t}</h3>
                <ul>{items.map(x => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="proof">
            <article className="proof-card reveal-up">
              <img src="/img/protagonista.webp" alt="Selo do programa Lojista Protagonista" loading="lazy" />
              <div><h3>Lojista Protagonista</h3><p>O programa que acumula pontos e premia quem mais se engaja com a rede. Aqui, dedicação tem valor.</p></div>
            </article>
            <article className="proof-card reveal-up">
              <img src="/img/anamaco.jpg" alt="Página da Revista ANAMACO com lojistas da Rede Attini" loading="lazy" />
              <div><h3>Na Revista ANAMACO</h3><p>Lojistas Attini ganharam página na principal revista do varejo de material de construção.</p></div>
            </article>
          </div>
        </section>

        <Blog />

        <LeadForm tab={aud} setTab={setAud} preset={preset} />
      </main>

      <footer className="ft">
        <div className="ft-giant" aria-hidden="true">{'ATTINI'.split('').map((c, i) => <span key={i}>{c}</span>)}</div>
        <div className="wrap ft-row">
          <p>Construir é tornar real tudo aquilo que é sonho.</p>
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
