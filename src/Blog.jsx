import { useEffect, useState } from 'react'

const API = 'https://www.redeattini.com.br/wp-json/wp/v2/posts?per_page=5&_embed=wp:featuredmedia'
const ALL = 'https://www.redeattini.com.br/blog/'

// Plano B se a API do WordPress não responder (posts reais de nov/2026)
const FALLBACK = [
  { t: 'Milhões movimentados em poucas horas: a 4ª edição do CONEXÃO ATTINI já tem data marcada', link: 'https://www.redeattini.com.br/2026/09/milhoes-movimentados-em-poucas-horas-a-4aedicao-do-conexao-attini-ja-tem-data-marcada/', date: '2026-09-08', ex: 'O CONEXÃO ATTINI é o encontro que reúne lojistas e indústrias do setor de materiais de construção em um só ambiente, com rodadas de negociação, aprendizado e conexão.', img: '/img/conexao.webp' },
  { t: 'Lojistas Attini ganham página na Revista ANAMACO e comprovam a força da rede', link: 'https://www.redeattini.com.br/2026/08/lojistas-attini-ganham-pagina-na-revista-anamaco-e-comprovam-a-forca-da-rede/', date: '2026-08-20', ex: 'Ser parte da Rede Attini vai muito além das rodadas de negócios. É também sobre visibilidade, credibilidade e portas que se abrem.', img: '/img/anamaco.jpg' },
  { t: 'Sucessão familiar: o legado além do sobrenome', link: 'https://www.redeattini.com.br/2026/03/sucessao-familiar-o-legado-alem-do-sobrenome/', date: '2026-03-06', ex: 'A longevidade de uma loja de material de construção está diretamente ligada à sua capacidade de transição.', img: 'https://www.redeattini.com.br/wp-content/uploads/2026/03/Sucessao-familiar-BLOG.jpg-768x480.jpeg' },
]

const text = html => new DOMParser().parseFromString(html, 'text/html').body.textContent.trim()
const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')

export default function Blog() {
  const [posts, setPosts] = useState(FALLBACK)

  useEffect(() => {
    fetch(API).then(r => (r.ok ? r.json() : Promise.reject())).then(list => {
      const p = list.map(p => {
        const m = p._embedded?.['wp:featuredmedia']?.[0]
        return { t: text(p.title.rendered), link: p.link, date: p.date.slice(0, 10), ex: text(p.excerpt.rendered).slice(0, 170), img: m?.media_details?.sizes?.medium_large?.source_url || m?.source_url }
      }).filter(p => p.img)
      if (p.length >= 3) setPosts(p)
    }).catch(() => {})
  }, [])

  const [first, ...rest] = posts
  return (
    <section className="blog wrap" id="blog" aria-labelledby="blog-t">
      <div className="blog-head">
        <div>
          <p className="eyebrow">Blog Attini</p>
          <h2 className="h2 split" id="blog-t"><span className="line"><span>Conteúdo de quem</span></span><span className="line"><span>vive o balcão.</span></span></h2>
        </div>
        <a href={ALL} target="_blank" rel="noopener" className="btn btn-o magnetic">Ver todos os posts ↗</a>
      </div>

      <div className="blog-grid">
        <a className="post post-big" href={first.link} target="_blank" rel="noopener" data-cursor="Ler">
          <div className="post-img"><img src={first.img} alt="" loading="lazy" /></div>
          <div className="post-c">
            <time dateTime={first.date}>{fmt(first.date)}</time>
            <h3>{first.t}</h3>
            <p>{first.ex}…</p>
            <span className="post-go">Ler matéria <b>→</b></span>
          </div>
        </a>
        <div className="post-list">
          {rest.map(p => (
            <a className="post post-row" href={p.link} target="_blank" rel="noopener" key={p.link} data-cursor="Ler">
              <div className="post-img"><img src={p.img} alt="" loading="lazy" /></div>
              <div className="post-c">
                <time dateTime={p.date}>{fmt(p.date)}</time>
                <h3>{p.t}</h3>
              </div>
              <span className="post-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
