import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { listPosts, listCategories, getPost, listComments, addComment, trackView, postHref } from './api'
import { Header, Footer, readAud, saveAud } from '../Layout'
import './blog.css'

const fmt = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
// Resumo igual ao começo do texto não vira lead (evita repetir o primeiro parágrafo)
const textOf = html => new DOMParser().parseFromString(html.replace(/<\/(p|h\d|li)>/g, ' $&'), 'text/html').body.textContent.replace(/\s+/g, ' ').trim()
const readTime = html => Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200))

// O conteúdo vem do painel, mas passa pelo filtro antes de ir para a tela. Só vídeos do YouTube/Vimeo entram como iframe.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe' && !/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//.test(node.getAttribute('src') || '')) node.parentNode?.removeChild(node)
})
const clean = html => DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target'] })

function setMeta(title, description) {
  document.title = title
  let m = document.querySelector('meta[name=description]')
  if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.append(m) }
  m.content = description
}

// Mesmo cabeçalho e rodapé da home. Trocar "Sou lojista/indústria" ou clicar no CTA
// guarda a escolha e leva para a seção certa da home.
function Shell({ children }) {
  const [aud, setAud] = useState(readAud)
  useEffect(() => {
    const h = e => {
      const t = e.target.closest('[data-aud],[data-tab]')
      if (!t) return
      const a = t.dataset.aud || t.dataset.tab
      saveAud(a); setAud(a)
      if (t.dataset.go) location.href = '/' + t.dataset.go
    }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])
  return (
    <>
      <Header aud={aud} blog />
      <main className="bl">{children}</main>
      <Footer blog />
    </>
  )
}

const Card = ({ p, big }) => (
  <a className={`post ${big ? 'post-big' : 'bl-card'}`} href={postHref(p)}>
    <div className="post-img">{p.cover_url && <img src={p.cover_url} alt={p.cover_alt || ''} loading="lazy" />}</div>
    <div className="post-c">
      <p className="bl-meta">{p.category?.name && <b>{p.category.name}</b>}<time dateTime={p.published_at}>{fmt(p.published_at)}</time></p>
      <h3>{p.title}</h3>
      {p.excerpt && <p>{p.excerpt.length > 180 ? p.excerpt.slice(0, 177) + '…' : p.excerpt}</p>}
      {big && <span className="post-go">Ler matéria <b>→</b></span>}
    </div>
  </a>
)

function BlogList() {
  const params = new URLSearchParams(location.search)
  const [cats, setCats] = useState([])
  const [q, setQ] = useState(params.get('q') || '')
  const [posts, setPosts] = useState(null)
  const [more, setMore] = useState(false)
  const cat = cats.find(c => c.slug === params.get('categoria'))
  const PAGE = 13

  useEffect(() => {
    setMeta('Blog | Rede Attini', 'Conteúdo de quem vive o balcão: gestão, mercado e as novidades da Rede Attini.')
    listCategories().then(c => {
      setCats(c)
      return listPosts({ q: params.get('q'), category: c.find(x => x.slug === params.get('categoria'))?.id, limit: PAGE })
    }).then(p => { setPosts(p); setMore(p.length === PAGE) })
  }, [])

  const loadMore = () => listPosts({ q: params.get('q'), category: cat?.id, from: posts.length, limit: PAGE }).then(p => { setPosts([...posts, ...p]); setMore(p.length === PAGE) })
  const search = e => { e.preventDefault(); location.search = q ? `?q=${encodeURIComponent(q)}` : '' }
  const filtered = params.get('q') || cat
  const [first, ...rest] = posts || []

  return (
    <section className="wrap bl-list">
      <div className="bl-top">
        <div>
          <p className="eyebrow">Blog Attini</p>
          <h1 className="h2">{cat ? cat.name : params.get('q') ? `Busca: ${params.get('q')}` : <>Conteúdo de quem<br />vive o balcão.</>}</h1>
        </div>
        <form className="bl-search" onSubmit={search} role="search">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar no blog" aria-label="Buscar no blog" />
        </form>
      </div>
      {cats.length > 0 && (
        <nav className="bl-cats" aria-label="Categorias">
          <a href="/blog" className={!cat ? 'on' : ''}>Todos</a>
          {cats.map(c => <a key={c.id} href={`/blog?categoria=${c.slug}`} className={cat?.id === c.id ? 'on' : ''}>{c.name}</a>)}
        </nav>
      )}
      {posts === null ? <p className="bl-empty">Carregando…</p>
        : !posts.length ? <p className="bl-empty">Nenhum post encontrado. <a href="/blog">Ver todos</a></p>
        : (
          <>
            {!filtered && <div className="bl-hero"><Card p={first} big /></div>}
            <div className="bl-grid">{(filtered ? posts : rest).map(p => <Card key={p.id} p={p} />)}</div>
            {more && <div className="bl-more"><button className="btn btn-o" onClick={loadMore}>Carregar mais</button></div>}
          </>
        )}
    </section>
  )
}

function Comments({ post }) {
  const [list, setList] = useState([])
  const [reply, setReply] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', content: '', site: '' })
  const [state, setState] = useState('')
  useEffect(() => { listComments(post.slug).then(setList) }, [post.slug])

  const send = async e => {
    e.preventDefault()
    setState('enviando')
    try { await addComment(post.slug, reply?.id || null, form.name, form.email, form.content, form.site) } catch (err) { return setState('erro:' + err.message) }
    setForm({ name: '', email: '', content: '', site: '' }); setReply(null); setState('ok')
  }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const roots = list.filter(c => !c.parent_id)
  const One = ({ c }) => (
    <li className={c.team ? 'team' : ''}>
      <p className="bl-c-who"><b>{c.author_name}</b>{c.team && <span>Rede Attini</span>}<time>{fmt(c.created_at)}</time></p>
      <p className="bl-c-txt">{c.content}</p>
      {!c.parent_id && <button className="bl-c-reply" onClick={() => { setReply(c); document.getElementById('comentar').scrollIntoView({ behavior: 'smooth' }) }}>Responder</button>}
      {list.some(x => x.parent_id === c.id) && <ul>{list.filter(x => x.parent_id === c.id).map(x => <One key={x.id} c={x} />)}</ul>}
    </li>
  )

  return (
    <section className="bl-comments" aria-labelledby="cm-t">
      <h2 id="cm-t">{list.length ? `${list.length} ${list.length > 1 ? 'comentários' : 'comentário'}` : 'Comentários'}</h2>
      {roots.length > 0 && <ul className="bl-c-list">{roots.map(c => <One key={c.id} c={c} />)}</ul>}
      <form className="bl-c-form" id="comentar" onSubmit={send}>
        <h3>{reply ? <>Respondendo a {reply.author_name} <button type="button" onClick={() => setReply(null)}>cancelar</button></> : 'Deixe seu comentário'}</h3>
        {state === 'ok' ? <p className="bl-c-ok">Recebemos seu comentário. Ele aparece aqui depois da moderação.</p> : (
          <>
            <div className="bl-c-row">
              <input required minLength={2} maxLength={80} placeholder="Nome" value={form.name} onChange={set('name')} aria-label="Nome" />
              <input required type="email" placeholder="E-mail (não será publicado)" value={form.email} onChange={set('email')} aria-label="E-mail" />
            </div>
            <input className="bl-hp" tabIndex={-1} autoComplete="off" value={form.site} onChange={set('site')} aria-hidden="true" />
            <textarea required minLength={2} maxLength={3000} rows={4} placeholder="Comentário" value={form.content} onChange={set('content')} aria-label="Comentário" />
            {state.startsWith('erro:') && <p className="bl-c-err">{state.slice(5)}</p>}
            <button className="btn btn-y" disabled={state === 'enviando'}>{state === 'enviando' ? 'Enviando…' : 'Publicar comentário'}</button>
          </>
        )}
      </form>
    </section>
  )
}

function PostPage({ slug }) {
  const [post, setPost] = useState()
  const [related, setRelated] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getPost(slug).then(p => {
      setPost(p)
      if (!p) return setMeta('Post não encontrado | Rede Attini', '')
      setMeta(`${p.seo_title || p.title} | Blog Rede Attini`, p.seo_description || p.excerpt)
      trackView(p)
      listPosts({ category: p.category_id, limit: 4 }).then(r => setRelated(r.filter(x => x.id !== p.id).slice(0, 3)))
    })
  }, [slug])

  if (post === undefined) return <p className="bl-empty wrap">Carregando…</p>
  if (!post) return (
    <section className="wrap bl-404">
      <p className="eyebrow">Erro 404</p>
      <h1 className="h2">Esse post não<br />existe mais.</h1>
      <a className="btn btn-y" href="/blog">Ver todos os posts</a>
    </section>
  )

  const draft = post.status !== 'published' || new Date(post.published_at) > new Date()
  const url = location.origin + postHref(post)
  const share = encodeURIComponent(url)
  return (
    <article className="bl-post">
      {draft && <p className="bl-preview">Pré-visualização: este post ainda não está publicado.</p>}
      <header className="wrap bl-p-head">
        <a href="/blog" className="bl-back">← Blog</a>
        <p className="bl-meta">{post.category?.name && <a href={`/blog?categoria=${post.category.slug}`}><b>{post.category.name}</b></a>}<time dateTime={post.published_at}>{post.published_at ? fmt(post.published_at) : 'Sem data'}</time><span>{readTime(post.content)} min de leitura</span></p>
        <h1>{post.title}</h1>
        {post.excerpt && !textOf(post.content).startsWith(post.excerpt.slice(0, 50)) && <p className="bl-lead">{post.excerpt}</p>}
        <p className="bl-by">Por <b>{post.author_name || 'Rede Attini'}</b></p>
      </header>
      {post.cover_url && <figure className="bl-cover"><img src={post.cover_url} alt={post.cover_alt || ''} /></figure>}
      <div className="bl-body">
        <div className="bl-content" dangerouslySetInnerHTML={{ __html: clean(post.content) }} />
        {post.tags?.length > 0 && <p className="bl-tags">{post.tags.map(t => <span key={t}>{t}</span>)}</p>}
        <div className="bl-share">
          <span>Compartilhe</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + url)}`} target="_blank" rel="noopener">WhatsApp</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`} target="_blank" rel="noopener">LinkedIn</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${share}`} target="_blank" rel="noopener">Facebook</a>
          <button onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true))}>{copied ? 'Link copiado' : 'Copiar link'}</button>
        </div>
        <aside className="bl-cta">
          <h2>Tem loja de material de construção?</h2>
          <p>Compre direto da indústria e tenha a força de uma rede inteira do seu lado.</p>
          <a className="btn btn-dark" href="/#contato">Vem pra Rede Attini →</a>
        </aside>
        {!draft && <Comments post={post} />}
      </div>
      {related.length > 0 && (
        <section className="wrap bl-related">
          <p className="eyebrow">Leia também</p>
          <div className="bl-grid">{related.map(p => <Card key={p.id} p={p} />)}</div>
        </section>
      )}
    </article>
  )
}

export default function BlogPages() {
  const path = location.pathname
  const legacy = path.match(/^\/\d{4}\/\d{2}\/([^/]+)\/?$/) // endereços antigos do WordPress continuam valendo
  const m = path.match(/^\/blog\/([^/]+)\/?$/) || legacy
  if (legacy) history.replaceState(null, '', `/blog/${legacy[1]}`)
  return <Shell>{m ? <PostPage slug={decodeURIComponent(m[1])} /> : <BlogList />}</Shell>
}
