import { useEffect, useRef, useState } from 'react'
import { Header, Footer, readAud, saveAud } from './Layout'
import './cadastro.css'

// /cadastro: ficha de filiação do Mautic (formulário 6) com o visual do site.
// Ordem igual à página antiga: máscara (maska) e validador (attini-form.js) antes do formulário;
// o mautic-form.js aplica as máscaras e chama o validador sozinho.
const MAUTIC = 'https://mkt.redeattini.com.br/form/generate.js?id=6'
const load = src => new Promise((ok, fail) => {
  const s = document.createElement('script')
  s.src = src; s.onload = ok; s.onerror = fail
  document.head.append(s)
})

const STEPS = [
  ['01', 'Empresa e loja', 'CNPJ, endereço, faturamento e estrutura da loja.'],
  ['02', 'Contatos', 'O sócio ou contato principal e, se quiser, financeiro, gerente e comprador.'],
  ['03', 'Indústrias', 'Com quais fornecedores a loja já trabalha.'],
]

export default function Cadastro() {
  const slot = useRef()
  const [aud, setAud] = useState(readAud)

  useEffect(() => {
    document.title = 'Cadastro | Rede Attini'
    // O mautic-form.js só cria este objeto DEPOIS de se inicializar. Com a página já carregada (nosso caso)
    // ele inicializa na hora e quebra sem ele: sem máscara e sem validação. Criar antes resolve.
    window.MauticFormValidations ||= {}
    Promise.allSettled([load('https://cdn.jsdelivr.net/npm/maska@3.2.1/dist/cdn/maska.js'), load('/js/attini-form.js')]).then(() => {
      const s = document.createElement('script')
      s.src = MAUTIC
      slot.current.append(s) // o generate.js insere o formulário logo depois do próprio <script>
    })

    // Blocos aparecem ao entrar na tela. Por margem, não por %: a ficha tem 5000px e nunca chegaria a 12% visível.
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { rootMargin: '0px 0px -60px 0px' })
    document.querySelectorAll('.cad-reveal').forEach(el => io.observe(el))

    // Cabeçalho: "Sou lojista/indústria" e CTAs levam para a home, como no blog
    const click = e => {
      const t = e.target.closest('[data-aud],[data-tab]')
      if (!t) return
      const a = t.dataset.aud || t.dataset.tab
      saveAud(a); setAud(a)
      if (t.dataset.go) location.href = '/' + t.dataset.go
    }
    document.addEventListener('click', click)
    return () => { io.disconnect(); document.removeEventListener('click', click) }
  }, [])

  return (
    <>
      <Header aud={aud} blog />
      <main className="cad">
        <section className="cad-hero wrap">
          <div className="cad-hero-txt">
            <p className="eyebrow cad-in" style={{ '--d': '.1s' }}>Ficha de filiação</p>
            <h1 className="h2 cad-title">
              <span className="line"><span>Faça parte da</span></span>
              <span className="line"><span><em>Rede Attini.</em></span></span>
            </h1>
            <p className="lead cad-in" style={{ '--d': '.55s' }}>Preencha os dados da sua loja. Com o cadastro em mãos, o time da Attini entra em contato para os próximos passos.</p>
            <a href="#ficha" className="btn btn-y cad-in" style={{ '--d': '.7s' }}>Preencher agora <b aria-hidden="true">↓</b></a>
          </div>
          <div className="cad-art cad-in" style={{ '--d': '.3s' }} aria-hidden="true">
            <div className="cad-pattern" />
            <img src="/logo-attini.svg" alt="" />
          </div>
        </section>

        <ol className="cad-steps wrap">
          {STEPS.map(([n, t, d], i) => (
            <li key={n} className="cad-reveal" style={{ '--d': `${i * 0.1}s` }}>
              <b>{n}</b>
              <h2>{t}</h2>
              <p>{d}</p>
            </li>
          ))}
        </ol>

        <section className="cad-form-wrap wrap" id="ficha">
          <div className="cad-card cad-reveal">
            <div id="cadastro-attini" ref={slot}>
              <p className="cad-loading"><span />Carregando a ficha…</p>
            </div>
          </div>
        </section>
      </main>
      <Footer blog />
    </>
  )
}
