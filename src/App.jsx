import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis, scrollTo } from './scroll'
import Hero, { AudSwitch } from './Hero'
import BrazilMap from './BrazilMap'
import Offers from './Offers'
import LeadForm from './LeadForm'
import Blog from './Blog'
import { STATS, INDUSTRY, RETAIL, JOIN, STORIES, BRANDS, PHONE, WHATS, SOCIAL, TOTAL_CITIES, STORES } from './data'

const MANIFESTO = 'Attini é o nome de uma tribo de formigas que cultiva o próprio alimento e ergue colônias com milhões de indivíduos. Nenhuma carrega o peso sozinha. A rede funciona igual: cada loja põe a sua força, e o volume de todas negocia por cada uma.'

// Tudo o que muda conforme o público escolhido
const AUD = {
  lojista: {
    ticker: ['Compra direta da indústria', 'Tabelas exclusivas', 'Conexão Attini', 'Festival de Prêmios', 'Lojista Protagonista', `${STORES} lojas`],
    nav: [['#lojista', 'Benefícios'], ['#como-entrar', 'Como entrar'], ['#rede', 'Onde atuamos'], ['#conexao', 'Conexão'], ['#historias', 'Histórias']],
    cta: 'Quero ser Attini',
    track: {
      id: 'lojista', eyebrow: 'Para o lojista', title: 'Preço de gigante.\nLoja de dono.', cards: RETAIL,
      lead: 'Sua loja continua com o seu nome, o seu jeito e o seu cliente. A rede entra com o que uma loja sozinha não consegue: volume, método e gente para trocar ideia.',
      cta: 'Quanto a sua loja pode ganhar comprando em rede?', ctaLabel: 'Quero ser Attini →',
    },
    cx: {
      h: 'A melhor condição\ndo ano, em um dia.', btn: 'Quero participar do próximo',
      d: 'No Conexão Attini você negocia frente a frente com as principais indústrias do setor, em condições que só a rede consegue. Na 1ª edição foram mais de R$ 12 milhões em negócios em um único dia. Quem está em outro estado participa online, com acesso às condições negociadas.',
    },
    brands: 'Indústrias que negociam com a rede',
    next: ['Sua loja pode ser a próxima história.', 'Quero ser Attini'],
  },
  industria: {
    ticker: ['Compra conjunta', 'Trade marketing', 'Conexão Attini', 'Festival de Prêmios', `${STORES} lojas`, `${TOTAL_CITIES} cidades`],
    nav: [['#industria', 'Por que a rede'], ['#ofertas', 'Cotas'], ['#rede', 'Onde atuamos'], ['#conexao', 'Conexão'], ['#historias', 'Histórias']],
    cta: 'Vender para a rede',
    track: {
      id: 'industria', eyebrow: 'Por que vender pela rede', title: `Uma porta.\n${STORES} lojas.`, cards: INDUSTRY,
      lead: 'O que a sua marca ganha quando vende para a rede, e não loja por loja.',
      cta: 'Quer ver o tamanho da rede na sua categoria?', ctaLabel: 'Falar com o comercial →',
    },
    cx: {
      h: 'Milhões em pedidos\nem poucas horas.', btn: 'Garantir a cota da minha marca', interest: 'Cota Conexão Attini',
      d: 'O Conexão Attini coloca a sua equipe comercial frente a frente com lojistas que decidem a compra na hora. Na 1ª edição, 60 lojas movimentaram mais de R$ 12 milhões em um único dia, e o evento já está na 4ª edição.',
    },
    brands: 'Quem já vende pela rede',
    next: ['Sua marca pode ser a próxima história.', 'Falar com o comercial'],
  },
}

// Chave nova: quem testou a v1 tinha "industria" salvo e não veria o lojista como padrão.
const readAud = () => { try { return localStorage.getItem('attini-aud-v2') || 'lojista' } catch { return 'lojista' } }

function Preloader({ onDone }) {
  const ref = useRef(), num = useRef()
  useEffect(() => {
    const o = { v: 0 }
    const tl = gsap.timeline({ onComplete: onDone })
    tl.to(o, { v: STORES, duration: 1.4, ease: 'power2.inOut', onUpdate: () => (num.current.textContent = Math.round(o.v)) })
      .to('.pre-bar i', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(ref.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.15')
    return () => tl.kill()
  }, [])
  return (
    <div className="pre" ref={ref} aria-hidden="true">
      <img src="/logo-attini.png" alt="" />
      <div className="pre-num"><span ref={num}>0</span><small>lojas conectadas</small></div>
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
        {AUD[aud].nav.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
      </nav>
      <div className="hdr-cta">
        <AudSwitch aud={aud} className="aud-sm" go />
        <a href="#contato" data-tab={aud} className="btn btn-y magnetic">{AUD[aud].cta}</a>
      </div>
    </header>
  )
}

const Lines = ({ children, as: T = 'h2', className = 'h2' }) => (
  <T className={`${className} split`}>{children.split('\n').map((l, i) => <span className="line" key={i}><span>{l}</span></span>)}</T>
)

// Trilha horizontal fixada (desktop). O pin vive no próprio componente: some junto quando o público muda.
function Track({ aud, id, eyebrow, title, lead, cards, cta, ctaLabel }) {
  const root = useRef()
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(), track = root.current.querySelector('.ind-track')
    mm.add('(min-width: 900px)', () => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - innerWidth + 40), ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => '+=' + track.scrollWidth, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      })
    })
    return () => mm.revert()
  }, [])
  return (
    <div>{/* invólucro estável: o pin-spacer do GSAP fica dentro dele, fora do alcance do React */}
      <section className="industry" id={id} ref={root}>
        <div className="ind-head wrap">
          <p className="eyebrow">{eyebrow}</p>
          <Lines>{title}</Lines>
          <p className="lead">{lead}</p>
        </div>
        <div className="ind-track">
          {cards.map(c => (
            <article className="ind-card" key={c.n}>
              <div className="ind-img"><img src={c.img} alt="" loading="lazy" /></div>
              <span className="ind-n">{c.n}</span>
              <h3>{c.t.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</h3>
              {c.d && <p>{c.d}</p>}
              {c.items && <ul>{c.items.map(x => <li key={x}>{x}</li>)}</ul>}
            </article>
          ))}
          <article className="ind-card ind-cta">
            <h3>{cta}</h3>
            <a href="#contato" data-tab={aud} className="btn btn-dark magnetic">{ctaLabel}</a>
          </article>
        </div>
      </section>
    </div>
  )
}

// Posts marcados "Histórias da rede" no painel; sem Supabase, as histórias fixas de data.js.
function Stories({ aud }) {
  const [t, label] = AUD[aud].next
  const [stories, setStories] = useState(STORIES)
  useEffect(() => {
    import('./blog/api').then(({ listPosts, postHref }) => listPosts({ stories: true, limit: 5 }).then(list => {
      if (list.length) setStories(list.map(p => ({ tag: p.tags[0] || p.category?.name || 'Rede Attini', img: p.cover_url, t: p.title, d: p.excerpt, link: postHref(p) })))
    })).catch(() => {})
  }, [])
  return (
    <section className="stories wrap" id="historias" aria-labelledby="st-t">
      <p className="eyebrow" id="st-t">Histórias da rede</p>
      <Lines>{'Gente de verdade,\nresultado de verdade.'}</Lines>
      <div className="st-grid">
        {stories.map(s => {
          const body = (
            <>
              <div className="st-img"><img src={s.img} alt="" loading="lazy" /><span className="st-tag">{s.tag}</span></div>
              <div className="st-c">
                {s.quote
                  ? <blockquote><p>“{s.quote}”</p><footer>{s.who}</footer></blockquote>
                  : <><h3>{s.t}</h3><p>{s.d}</p></>}
                {s.link && <span className="st-go">Ler a história <b>↗</b></span>}
              </div>
            </>
          )
          return s.link
            ? <a key={s.t || s.who} className="story reveal-up" href={s.link} data-cursor="Ler">{body}</a>
            : <article key={s.t || s.who} className="story reveal-up">{body}</article>
        })}
        <div className="story st-next reveal-up">
          <h3>{t}</h3>
          <a href="#contato" data-tab={aud} className="btn btn-dark magnetic">{label} →</a>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [aud, setAud] = useState(readAud)
  const [preset, setPreset] = useState(null)
  const A = AUD[aud]

  useEffect(() => { try { localStorage.setItem('attini-aud-v2', aud) } catch {} }, [aud])

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

  // Animações das seções que existem para os dois públicos (uma vez)
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!ready) { lenis.stop(); return }
    lenis.start()

    const ctx = gsap.context(() => {
      gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
      gsap.from('.hero-a .reveal-up, .hdr', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.3 })

      gsap.to('.manifesto .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto-txt', start: 'top 75%', end: 'bottom 55%', scrub: true } })

      gsap.utils.toArray('.stat-n').forEach(el => {
        const o = { v: 0 }, end = +el.dataset.v
        gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onUpdate: () => (el.textContent = Math.round(o.v)) })
      })

      gsap.from('.door', { y: 100, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.doors', start: 'top 80%' } })

      gsap.fromTo('.cx-media', { clipPath: 'inset(18% 22% 18% 22% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.conexao', start: 'top bottom', end: 'center center', scrub: true } })
      gsap.fromTo('.cx-big', { xPercent: 10 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.conexao', start: 'top bottom', end: 'bottom top', scrub: true } })

      gsap.from('.ft-giant img', { yPercent: 100, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ft', start: 'top 70%' } })
    })

    // Links internos (e o seletor do header, via data-go). Espera um instante para o
    // conteúdo do público recém-escolhido montar antes de medir o destino.
    const anchors = e => {
      const a = e.target.closest('a[href^="#"], [data-go]')
      if (!a) return
      e.preventDefault()
      const href = a.dataset.go || a.getAttribute('href')
      setTimeout(() => scrollTo(href, { offset: href === '#contato' ? -40 : 0 }), 30)
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
    // Chegando de outra página com #contato (ex.: CTA do blog), rola até a seção depois da abertura
    if (location.hash.length > 1) setTimeout(() => scrollTo(location.hash, { offset: location.hash === '#contato' ? -40 : 0 }), 400)
    addEventListener('load', refresh)
    document.fonts.ready.then(refresh)

    return () => { ctx.revert(); document.removeEventListener('click', anchors); off(); removeEventListener('load', refresh) }
  }, [ready])

  // Revelações genéricas: roda de novo quando o público muda, só nos elementos que acabaram de montar
  useEffect(() => {
    if (!ready) return
    ScrollTrigger.getAll().forEach(t => t.trigger && !t.trigger.isConnected && t.kill())
    const fresh = sel => gsap.utils.toArray(sel).filter(el => !el.closest('.hero') && !el.dataset.anim && (el.dataset.anim = 1))
    fresh('.split').forEach(el => gsap.from(el.querySelectorAll('.line > span'), {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%' },
    }))
    fresh('.reveal-up').forEach(el => gsap.from(el, {
      y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' },
    }))
    // Imagens: abrem com máscara e fazem parallax
    fresh('.reveal-img').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0 round 28px)' }, { clipPath: 'inset(0% 0 0 0 round 28px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      const img = el.querySelector('img')
      img && gsap.fromTo(img, { yPercent: -8, scale: 1.15 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  }, [ready, aud])

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
          <div className="ticker-in">{[...A.ticker, ...A.ticker, ...A.ticker].map((t, i) => <span key={i}>{t}<b>✦</b></span>)}</div>
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

        <section className="impact wrap" aria-labelledby="impact-t">
          <p className="eyebrow" id="impact-t">A força da rede em números</p>
          <div className="stats">
            {STATS.map(s => (
              <div className="stat reveal-up" key={s.label}>
                <p className="stat-v">{s.prefix && <small>{s.prefix}</small>}<span className="stat-n" data-v={s.value}>{s.value}</span>{s.suffix && <small>{s.suffix}</small>}</p>
                <p className="stat-l">{s.label}</p>
                <p className="stat-note">{s.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="doors wrap" aria-label="Escolha o seu caminho">
          <a href="#lojista" data-aud="lojista" className={`door door-loj ${aud === 'lojista' ? 'pick' : ''}`} data-cursor="Entrar">
            <div className="door-photo"><img src="/img/quem-somos.webp" alt="" loading="lazy" /></div>
            <div className="door-c">
              <p className="eyebrow">Sou lojista</p>
              <h3>Preço de gigante, sem deixar de ser dono.</h3>
              <ul><li>Compra direta com a indústria</li><li>Gestão e assessoria do setor</li><li>{STORES} lojas do seu lado</li></ul>
              <span className="door-go">Ver benefícios <b>→</b></span>
            </div>
          </a>
          <a href="#industria" data-aud="industria" className={`door door-ind ${aud === 'industria' ? 'pick' : ''}`} data-cursor="Entrar">
            <img src="/img/ai/caminhao.webp" alt="" loading="lazy" />
            <div className="door-c">
              <p className="eyebrow">Sou indústria</p>
              <h3>Venda para {STORES} lojas com uma negociação.</h3>
              <ul><li>Política de preços diferenciada para toda a rede</li><li>Acesso direto ao dono e comprador da loja</li></ul>
              <span className="door-go">Ver o que a rede oferece <b>→</b></span>
            </div>
          </a>
        </section>

        <BrazilMap />

        <Track key={aud} aud={aud} {...A.track} />

        {aud === 'industria' ? <Offers /> : (
          <section className="retail wrap" id="como-entrar">
            <div className="retail-top">
              <div className="retail-head">
                <p className="eyebrow">Como entrar na rede</p>
                <Lines>{'Três passos\npara entrar.'}</Lines>
                <ol className="join">
                  {JOIN.map(([t, d], i) => (
                    <li className="reveal-up" key={t}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{t}</h3><p>{d}</p></div></li>
                  ))}
                </ol>
                <a href="#contato" data-tab="lojista" className="btn btn-y magnetic reveal-up">Quero ser Attini</a>
              </div>
              <figure className="retail-photo reveal-up">
                <img src="/img/quem-somos.webp" alt="Lojista associado da Rede Attini em sua loja de material de construção" loading="lazy" />
                <figcaption><b>{STORES}</b> lojas Attini em {TOTAL_CITIES} cidades</figcaption>
              </figure>
            </div>
          </section>
        )}

        <section className="conexao" id="conexao">
          <div className="cx-big" aria-hidden="true">CONEXÃO ATTINI · CONEXÃO ATTINI ·</div>
          <div className="cx-media">
            <img src="/img/conexao.webp" alt="Aperto de mão sob a marca Conexão Attini, o evento de negócios da rede" loading="lazy" />
          </div>
          <div className="cx-copy wrap">
            <p className="eyebrow">O evento da rede</p>
            <Lines>{A.cx.h}</Lines>
            <p className="lead reveal-up">{A.cx.d}</p>
            <div className="ctas reveal-up">
              <a href="#contato" data-tab={aud} data-interest={A.cx.interest} className="btn btn-y magnetic">{A.cx.btn}</a>
            </div>
          </div>
        </section>

        <Stories aud={aud} />

        <section className="brands" aria-labelledby="brands-t">
          <div className="wrap"><p className="eyebrow" id="brands-t">{A.brands}</p></div>
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

        <Blog />

        <LeadForm tab={aud} setTab={setAud} preset={preset} />
      </main>

      <footer className="ft">
        <div className="ft-giant"><img src="/logo-attini.svg" alt="Rede Attini" /></div>
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
