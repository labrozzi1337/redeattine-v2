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
      <a href={blog ? '/' : '#topo'} className="hdr-logo" aria-label="Rede Attini, página inicial"><img src="/logo-attini.png" alt="Rede Attini" width="110" height="26" /></a>
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

export function Footer({ blog }) {
  const at = h => (blog ? '/' + h : h)
  return (
    <>
      <footer className="ft">
        <div className="ft-giant"><img src="/logo-attini-wordmark.png" alt="Attini" width="1556" height="350" /></div>
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
