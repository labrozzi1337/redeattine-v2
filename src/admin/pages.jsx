import { useEffect, useRef, useState } from 'react'
import { Icon, Switch, Badge, Modal, toast, uploadImage, statusOf, fmtDate, fmtDateTime, fmtN, ROLES, ROLE_HINT, call } from './ui'

const Head = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="page-actions">{children}</div>}</div>
)

// ------------------------------------------------------------------ Painel
function Bars({ daily }) {
  const max = Math.max(1, ...daily.map(d => d.views)), n = daily.length
  const label = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  return (
    <div className="bars">
      <svg viewBox={`0 0 ${n * 10} 100`} preserveAspectRatio="none" role="img" aria-label="Visualizações por dia">
        {daily.map((d, i) => (
          <rect key={d.day} x={i * 10 + 1.5} width="7" y={100 - (d.views / max) * 96} height={(d.views / max) * 96 || 0.6} rx="1.5">
            <title>{`${label(d.day)}: ${fmtN(d.views)} visualizações`}</title>
          </rect>
        ))}
      </svg>
      <div className="bars-x"><span>{label(daily[0].day)}</span><span>{label(daily[Math.floor(n / 2)].day)}</span><span>{label(daily[n - 1].day)}</span></div>
    </div>
  )
}

export function Dashboard({ me }) {
  const [days, setDays] = useState(30)
  const [s, setS] = useState(null)
  const [posts, setPosts] = useState([])
  const [pendingC, setPendingC] = useState(0)
  useEffect(() => { setS(null); call('/admin/stats?days=' + days).then(setS).catch(e => toast(e.message, true)) }, [days])
  useEffect(() => {
    call('/admin/posts').then(setPosts).catch(() => {})
    call('/admin/counts').then(c => setPendingC(c.comments)).catch(() => {})
  }, [])

  const byId = Object.fromEntries(posts.map(p => [p.id, p]))
  const published = posts.filter(p => statusOf(p) === 'published').length
  const pending = posts.filter(p => p.status === 'pending')
  const mine = posts.filter(p => p.status !== 'published' && (me.role !== 'author' || p.author_id === me.id)).slice(0, 5)
  const delta = s && s.prev_views ? Math.round(((s.views - s.prev_views) / s.prev_views) * 100) : null
  const dev = s?.devices || {}, devTotal = (dev.mobile || 0) + (dev.desktop || 0)
  const refMax = Math.max(1, ...(s?.referrers || []).map(r => r.views))

  return (
    <div className="page">
      <Head title={`Olá, ${me.name.split(' ')[0]}`} sub="Como o blog está indo.">
        <select value={days} onChange={e => setDays(+e.target.value)} aria-label="Período">
          <option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option>
        </select>
        <a href="#/posts/novo" className="btn-p"><Icon n="plus" /> Escrever post</a>
      </Head>

      <div className="kpis">
        <div className="kpi"><span>Visualizações</span><b>{s ? fmtN(s.views) : '…'}</b>{delta !== null && <small className={delta >= 0 ? 'up' : 'down'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs. período anterior</small>}</div>
        <div className="kpi"><span>Visitantes únicos</span><b>{s ? fmtN(s.visitors) : '…'}</b></div>
        <div className="kpi"><span>Posts publicados</span><b>{fmtN(published)}</b></div>
        <a className={`kpi ${pending.length ? 'attn' : ''}`} href="#/posts?status=pending"><span>Em revisão</span><b>{pending.length}</b></a>
        {me.role !== 'author' && <a className={`kpi ${pendingC ? 'attn' : ''}`} href="#/comentarios"><span>Comentários pendentes</span><b>{pendingC}</b></a>}
      </div>

      <div className="dash">
        <section className="card span2">
          <h2>Visualizações por dia</h2>
          {s ? (s.views ? <Bars daily={s.daily} /> : <p className="empty">Ainda sem visitas neste período.</p>) : <p className="empty">Carregando…</p>}
        </section>
        <section className="card">
          <h2>De onde vêm os leitores</h2>
          {s?.referrers?.length ? (
            <ul className="hbars">{s.referrers.map(r => <li key={r.name}><span>{r.name}</span><b>{fmtN(r.views)}</b><i style={{ width: `${(r.views / refMax) * 100}%` }} /></li>)}</ul>
          ) : <p className="empty">Sem dados ainda.</p>}
          {devTotal > 0 && <p className="devices"><span>📱 Celular <b>{Math.round(((dev.mobile || 0) / devTotal) * 100)}%</b></span><span>💻 Computador <b>{Math.round(((dev.desktop || 0) / devTotal) * 100)}%</b></span></p>}
        </section>
        <section className="card span2">
          <h2>Posts mais lidos</h2>
          {s?.posts?.length ? (
            <table className="tbl compact">
              <thead><tr><th>Post</th><th className="num">Visualizações</th><th className="num">Visitantes</th></tr></thead>
              <tbody>{s.posts.slice(0, 8).map(p => byId[p.id] && (
                <tr key={p.id}><td><a href={`#/posts/${p.id}`}>{byId[p.id].title}</a></td><td className="num">{fmtN(p.views)}</td><td className="num">{fmtN(p.visitors)}</td></tr>
              ))}</tbody>
            </table>
          ) : <p className="empty">Os posts mais lidos aparecem aqui.</p>}
        </section>
        <section className="card">
          <h2>{me.role === 'author' ? 'Seus rascunhos' : 'Continue de onde parou'}</h2>
          {mine.length ? <ul className="mini">{mine.map(p => <li key={p.id}><a href={`#/posts/${p.id}`}>{p.title || 'Sem título'}</a><Badge p={p} /></li>)}</ul> : <p className="empty">Nenhum rascunho. <a href="#/posts/novo">Escrever agora</a></p>}
        </section>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Posts
const TABS = [['all', 'Todos'], ['published', 'Publicados'], ['scheduled', 'Agendados'], ['pending', 'Em revisão'], ['draft', 'Rascunhos']]

export function Posts({ me }) {
  const [rows, setRows] = useState(null)
  const [cats, setCats] = useState([])
  const [views, setViews] = useState({})
  const [tab, setTab] = useState(new URLSearchParams(location.hash.split('?')[1]).get('status') || 'all')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const pub = me.role !== 'author'

  const load = () => call('/admin/posts').then(setRows).catch(e => toast(e.message, true))
  useEffect(() => {
    load()
    call('/categories').then(setCats).catch(() => {})
    call('/admin/stats?days=30').then(d => setViews(Object.fromEntries(d.posts.map(p => [p.id, p.views])))).catch(() => {})
  }, [])

  if (!rows) return <div className="page"><p className="empty">Carregando…</p></div>
  const count = k => k === 'all' ? rows.length : rows.filter(r => statusOf(r) === k).length
  const term = q.trim().toLowerCase()
  const list = rows.filter(r => (tab === 'all' || statusOf(r) === tab) && (!cat || r.category_id === cat) && (!term || r.title.toLowerCase().includes(term)))
  const catName = Object.fromEntries(cats.map(c => [c.id, c.name]))

  const toggle = async (r, k) => {
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, [k]: !r[k] } : x))
    try { await call('/admin/posts/' + r.id, { method: 'PATCH', body: { [k]: !r[k] } }); toast(!r[k] ? 'Vai aparecer no site.' : 'Saiu dessa seção do site.') }
    catch (err) { toast(err.message, true); load() }
  }
  const duplicate = async r => {
    try {
      const data = await call(`/admin/posts/${r.id}/duplicate`, { method: 'POST' })
      toast('Cópia criada como rascunho.'); location.hash = '/posts/' + data.id
    } catch (err) { toast(err.message, true) }
  }
  const remove = async r => {
    if (!confirm(`Excluir "${r.title}" definitivamente?`)) return
    try { await call('/admin/posts/' + r.id, { method: 'DELETE' }) } catch (err) { return toast(err.message, true) }
    setRows(rs => rs.filter(x => x.id !== r.id)); toast('Post excluído.')
  }

  return (
    <div className="page">
      <Head title="Posts" sub={`${rows.length} no total`}><a href="#/posts/novo" className="btn-p"><Icon n="plus" /> Novo post</a></Head>
      <div className="filters">
        <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} <small>{count(k)}</small></button>)}</div>
        <div className="filters-r">
          <label className="search"><Icon n="search" s={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar pelo título" /></label>
          <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Categoria"><option value="">Todas as categorias</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>
      {!list.length ? <p className="empty card">Nenhum post aqui. {tab === 'all' && !term && <a href="#/posts/novo">Escrever o primeiro</a>}</p> : (
        <div className="card flush">
          <table className="tbl posts">
            <thead><tr><th>Post</th><th>Status</th><th className="hide-m">Categoria</th>{pub && <><th className="c">Home</th><th className="c">Histórias</th></>}<th className="num hide-m">Leituras 30d</th><th /></tr></thead>
            <tbody>{list.map(r => (
              <tr key={r.id}>
                <td>
                  <a className="post-cell" href={`#/posts/${r.id}`}>
                    <span className="thumb">{r.cover_url && <img src={r.cover_url} alt="" loading="lazy" />}</span>
                    <span><b>{r.title || 'Sem título'}{r.featured && <em className="star" title="Destaque">★</em>}</b><small>{r.author_name || 'Rede Attini'} · {statusOf(r) === 'draft' || r.status === 'pending' ? 'editado ' + fmtDate(r.updated_at) : fmtDate(r.published_at)}</small></span>
                  </a>
                </td>
                <td><Badge p={r} /></td>
                <td className="hide-m muted">{catName[r.category_id] || '—'}</td>
                {pub && <>
                  <td className="c"><Switch bare on={r.show_home} onChange={() => toggle(r, 'show_home')} label={`Mostrar na home: ${r.title}`} /></td>
                  <td className="c"><Switch bare on={r.show_stories} onChange={() => toggle(r, 'show_stories')} label={`Mostrar em Histórias: ${r.title}`} /></td>
                </>}
                <td className="num hide-m">{fmtN(views[r.id])}</td>
                <td className="row-actions">
                  {statusOf(r) === 'published' && <a className="icon-btn" href={`/blog/${r.slug}`} target="_blank" rel="noopener" title="Ver no site" aria-label="Ver no site"><Icon n="external" s={16} /></a>}
                  <button className="icon-btn" onClick={() => duplicate(r)} title="Duplicar" aria-label="Duplicar"><Icon n="copy" s={16} /></button>
                  {(pub || (r.author_id === me.id && r.status !== 'published')) && <button className="icon-btn danger" onClick={() => remove(r)} title="Excluir" aria-label="Excluir"><Icon n="trash" s={16} /></button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Mídia
function Uploader({ onDone, compact }) {
  const [busy, setBusy] = useState(0)
  const [over, setOver] = useState(false)
  const input = useRef()
  const send = async files => {
    const out = []
    setBusy(files.length)
    for (const f of files) {
      try { out.push(await uploadImage(f)) } catch (e) { toast(e.message, true) }
      setBusy(b => b - 1)
    }
    if (out.length) { toast(out.length > 1 ? `${out.length} imagens enviadas.` : 'Imagem enviada.'); onDone(out) }
  }
  return (
    <button type="button" className={`drop ${compact ? 'small' : ''} ${over ? 'over' : ''}`} onClick={() => input.current.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); send([...e.dataTransfer.files]) }}>
      <Icon n="upload" s={24} />
      {busy ? `Enviando ${busy}…` : <span><b>Arraste imagens aqui</b> ou clique para escolher</span>}
      <small>JPG, PNG, WEBP ou GIF. Fotos grandes são reduzidas automaticamente.</small>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => { send([...e.target.files]); e.target.value = '' }} />
    </button>
  )
}

const useMedia = () => {
  const [items, setItems] = useState(null)
  const load = () => call('/admin/media').then(setItems).catch(e => toast(e.message, true))
  useEffect(() => { load() }, [])
  return [items, setItems]
}

export function MediaPicker({ onPick, onClose }) {
  const [items, setItems] = useMedia()
  const [sel, setSel] = useState(null)
  const [alt, setAlt] = useState('')
  const choose = m => { setSel(m); setAlt(m.alt) }
  return (
    <Modal title="Escolher imagem" onClose={onClose} wide>
      <div className="picker">
        <div>
          <Uploader compact onDone={list => { setItems(i => [...list, ...(i || [])]); choose(list[0]) }} />
          <div className="mgrid">{items === null ? <p className="empty">Carregando…</p> : items.map(m => (
            <button key={m.id} className={`mitem ${sel?.id === m.id ? 'on' : ''}`} onClick={() => choose(m)} onDoubleClick={() => onPick(m)}><img src={m.url} alt={m.alt} loading="lazy" /></button>
          ))}</div>
        </div>
        <aside className="picker-side">
          {sel ? (
            <>
              <img src={sel.url} alt="" />
              <label className="fld"><span>Descrição da imagem</span><input value={alt} onChange={e => setAlt(e.target.value)} placeholder="O que aparece na foto?" /></label>
              <button className="btn-p" onClick={async () => {
                if (alt !== sel.alt) await call('/admin/media/' + sel.id, { method: 'PATCH', body: { alt } }).catch(() => {})
                onPick({ ...sel, alt })
              }}>Usar esta imagem</button>
            </>
          ) : <p className="muted">Envie uma imagem nova ou escolha uma da biblioteca.</p>}
        </aside>
      </div>
    </Modal>
  )
}

export function Media({ me }) {
  const [items, setItems] = useMedia()
  const [sel, setSel] = useState(null)
  const [uses, setUses] = useState(null)
  useEffect(() => {
    if (!sel) return
    setUses(null)
    call('/admin/media/' + sel.id).then(setUses).catch(() => setUses([]))
  }, [sel?.id])

  const saveAlt = async alt => { await call('/admin/media/' + sel.id, { method: 'PATCH', body: { alt } }); setItems(i => i.map(x => x.id === sel.id ? { ...x, alt } : x)); toast('Descrição salva.') }
  const remove = async () => {
    if (!confirm(uses?.length ? `Esta imagem está em ${uses.length} post(s) e vai sumir de lá. Excluir mesmo assim?` : 'Excluir esta imagem?')) return
    try { await call('/admin/media/' + sel.id, { method: 'DELETE' }) } catch (err) { return toast(err.message, true) }
    setItems(i => i.filter(x => x.id !== sel.id)); setSel(null); toast('Imagem excluída.')
  }
  const canDelete = sel && (me.role !== 'author' || sel.uploaded_by === me.id)

  return (
    <div className="page">
      <Head title="Mídia" sub={items ? `${items.length} imagens` : ''} />
      <Uploader onDone={list => setItems(i => [...list, ...(i || [])])} />
      <div className="mgrid big">{items?.map(m => (
        <button key={m.id} className={`mitem ${sel?.id === m.id ? 'on' : ''}`} onClick={() => setSel(m)}><img src={m.url} alt={m.alt} loading="lazy" /></button>
      ))}</div>
      {sel && (
        <Modal title="Detalhes da imagem" onClose={() => setSel(null)} wide>
          <div className="mdetail">
            <img src={sel.url} alt={sel.alt} />
            <div>
              <AltField key={sel.id} value={sel.alt} onSave={saveAlt} />
              <dl className="meta">
                <dt>Enviada em</dt><dd>{fmtDateTime(sel.created_at)}</dd>
                {sel.width && <><dt>Tamanho</dt><dd>{sel.width} × {sel.height}px · {Math.round(sel.size / 1024)} KB</dd></>}
                <dt>Usada em</dt><dd>{uses === null ? '…' : uses.length ? uses.map(u => <a key={u.id} href={`#/posts/${u.id}`}>{u.title}</a>) : 'Nenhum post'}</dd>
              </dl>
              <div className="row-btns">
                <button className="btn-s" onClick={() => navigator.clipboard.writeText(sel.url).then(() => toast('Link copiado.'))}><Icon n="copy" s={16} /> Copiar link</button>
                {canDelete && <button className="btn-s danger" onClick={remove}><Icon n="trash" s={16} /> Excluir</button>}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AltField({ value, onSave }) {
  const [v, setV] = useState(value)
  return (
    <label className="fld"><span>Descrição da imagem</span>
      <input value={v} onChange={e => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} placeholder="O que aparece na foto?" />
      <small>Salva ao sair do campo.</small>
    </label>
  )
}

// ------------------------------------------------------------------ Comentários
export function Comments({ me }) {
  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState(null)
  const [reply, setReply] = useState(null)
  const [text, setText] = useState('')
  const load = () => call('/admin/comments?status=' + tab).then(setRows).catch(e => toast(e.message, true))
  useEffect(() => { setRows(null); load() }, [tab])

  const setStatus = async (c, status) => {
    try { await call('/admin/comments/' + c.id, { method: 'PATCH', body: { status } }) } catch (err) { return toast(err.message, true) }
    setRows(r => r.filter(x => x.id !== c.id)); toast(status === 'approved' ? 'Comentário aprovado. Já aparece no site.' : status === 'spam' ? 'Marcado como spam.' : 'Voltou para pendentes.')
  }
  const remove = async c => {
    if (!confirm('Excluir este comentário?')) return
    await call('/admin/comments/' + c.id, { method: 'DELETE' }).catch(e => toast(e.message, true)); setRows(r => r.filter(x => x.id !== c.id)); toast('Comentário excluído.')
  }
  const sendReply = async c => {
    if (text.trim().length < 2) return
    try { await call('/admin/comments', { method: 'POST', body: { reply_to: c.id, content: text.trim() } }) } catch (err) { return toast(err.message, true) }
    if (c.status === 'pending') setRows(r => r.filter(x => x.id !== c.id)) // a resposta já aprova o comentário
    setReply(null); setText(''); toast('Resposta publicada.')
  }

  return (
    <div className="page">
      <Head title="Comentários" sub="Nada aparece no site antes de ser aprovado." />
      <div className="filters"><div className="tabs">{[['pending', 'Pendentes'], ['approved', 'Aprovados'], ['spam', 'Spam']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div></div>
      {rows === null ? <p className="empty">Carregando…</p> : !rows.length ? <p className="empty card">{tab === 'pending' ? 'Tudo em dia. Nenhum comentário esperando.' : 'Nada por aqui.'}</p> : (
        <ul className="comments">{rows.map(c => (
          <li key={c.id} className="card">
            <p className="c-who"><b>{c.author_name}</b>{c.user_id ? <span className="badge ok">Equipe</span> : <a href={`mailto:${c.author_email}`}>{c.author_email}</a>}<small>{fmtDateTime(c.created_at)}</small></p>
            <p className="c-on">em <a href={`/blog/${c.post?.slug}#comentar`} target="_blank" rel="noopener">{c.post?.title}</a>{c.parent_id && ' (resposta)'}</p>
            <p className="c-txt">{c.content}</p>
            <div className="row-btns">
              {tab !== 'approved' && <button className="btn-s ok" onClick={() => setStatus(c, 'approved')}>Aprovar</button>}
              {tab === 'approved' && <button className="btn-s" onClick={() => setStatus(c, 'pending')}>Desaprovar</button>}
              {tab !== 'spam' && <button className="btn-s" onClick={() => setStatus(c, 'spam')}>Spam</button>}
              {tab !== 'spam' && <button className="btn-s" onClick={() => { setReply(c.id); setText('') }}>Responder</button>}
              <button className="btn-s danger" onClick={() => remove(c)}>Excluir</button>
            </div>
            {reply === c.id && (
              <div className="reply">
                <textarea rows={3} autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={`Responder como ${me.name} (Rede Attini)`} />
                <div className="row-btns"><button className="btn-p" onClick={() => sendReply(c)}>Publicar resposta</button><button className="link-btn" onClick={() => setReply(null)}>Cancelar</button></div>
              </div>
            )}
          </li>
        ))}</ul>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Categorias
export function Categories() {
  const [rows, setRows] = useState(null)
  const [name, setName] = useState('')
  const load = () => call('/admin/categories').then(setRows).catch(e => toast(e.message, true))
  useEffect(() => { load() }, [])
  const add = async e => {
    e.preventDefault()
    if (!name.trim()) return
    try { await call('/admin/categories', { method: 'POST', body: { name } }); setName(''); load(); toast('Categoria criada.') }
    catch (err) { toast(err.status === 409 ? 'Essa categoria já existe.' : err.message, true) }
  }
  const rename = async c => {
    const n = prompt('Novo nome da categoria:', c.name)
    if (!n?.trim() || n === c.name) return
    try { await call('/admin/categories/' + c.id, { method: 'PATCH', body: { name: n } }); load(); toast('Categoria renomeada.') }
    catch (err) { toast(err.status === 409 ? 'Já existe uma categoria com esse nome.' : err.message, true) }
  }
  const remove = async c => {
    if (!confirm(`Excluir "${c.name}"? Os ${c.posts} post(s) dela ficam sem categoria.`)) return
    await call('/admin/categories/' + c.id, { method: 'DELETE' }).catch(e => toast(e.message, true)); load(); toast('Categoria excluída.')
  }
  return (
    <div className="page narrow">
      <Head title="Categorias" sub="Organizam o blog e viram filtros na página /blog." />
      <form className="inline-form card" onSubmit={add}><input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da nova categoria" /><button className="btn-p">Adicionar</button></form>
      {rows && (
        <div className="card flush">
          <table className="tbl"><thead><tr><th>Categoria</th><th className="num">Posts</th><th /></tr></thead>
            <tbody>{rows.map(c => (
              <tr key={c.id}><td><b>{c.name}</b><small className="muted"> /blog?categoria={c.slug}</small></td><td className="num">{c.posts}</td>
                <td className="row-actions"><button className="link-btn" onClick={() => rename(c)}>Renomear</button><button className="icon-btn danger" onClick={() => remove(c)} aria-label="Excluir"><Icon n="trash" s={16} /></button></td></tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Usuários
// Convite e nova senha geram um link. Com e-mail configurado ele também vai por e-mail;
// sem e-mail, o administrador copia e manda (WhatsApp, por exemplo).
function LinkBox({ info, onClose }) {
  const [copied, setCopied] = useState(false)
  return (
    <Modal title={info.title} onClose={onClose}>
      <div className="linkbox">
        <p>{info.emailed ? `Enviamos o link por e-mail para ${info.email}. Se preferir, copie e mande por outro canal:` : `Copie o link e mande para ${info.name} (por WhatsApp, por exemplo). Ele vale ${info.days}.`}</p>
        <input readOnly value={info.link} onFocus={e => e.target.select()} />
        <button className="btn-p" onClick={() => navigator.clipboard.writeText(info.link).then(() => setCopied(true))}><Icon n="copy" s={16} /> {copied ? 'Link copiado' : 'Copiar link'}</button>
      </div>
    </Modal>
  )
}

export function Users({ me }) {
  const [rows, setRows] = useState(null)
  const [inv, setInv] = useState({ name: '', email: '', role: 'author' })
  const [busy, setBusy] = useState(false)
  const [linkInfo, setLinkInfo] = useState(null)
  const load = () => call('/admin/users').then(setRows).catch(e => toast(e.message, true))
  useEffect(() => { load() }, [])

  const invite = async e => {
    e.preventDefault(); setBusy(true)
    try {
      const r = await call('/admin/users', { method: 'POST', body: inv })
      toast(`${r.name} criado. Login: ${r.email}, senha provisória: ${r.password}`)
      setInv({ name: '', email: '', role: 'author' }); load()
    } catch (err) { toast(err.message, true) }
    setBusy(false)
  }
  const setRole = async (u, role) => {
    try { await call('/admin/users/' + u.id, { method: 'PATCH', body: { role } }); toast(`${u.name} agora é ${ROLES[role]}.`) } catch (err) { toast(err.message, true) }
    load()
  }
  const remove = async u => {
    if (!confirm(`Remover o acesso de ${u.name}? Os posts dele continuam no blog.`)) return
    try { await call('/admin/users/' + u.id, { method: 'DELETE' }); toast('Acesso removido.'); load() } catch (err) { toast(err.message, true) }
  }
  const newLink = async u => {
    try {
      const r = await call(`/admin/users/${u.id}/link`, { method: 'POST' })
      setLinkInfo({ ...r, title: u.pending ? 'Novo link de convite' : 'Link de nova senha', name: u.name, email: u.email, days: u.pending ? 'por 7 dias' : 'por 24 horas' })
    } catch (err) { toast(err.message, true) }
  }

  return (
    <div className="page narrow">
      <Head title="Usuários" sub="Quem pode escrever e publicar no blog." />
      <form className="card invite" onSubmit={invite}>
        <h2>Novo usuário</h2>
        <div className="invite-row">
          <input required placeholder="Nome" value={inv.name} onChange={e => setInv({ ...inv, name: e.target.value })} />
          <input required type="email" placeholder="E-mail" value={inv.email} onChange={e => setInv({ ...inv, email: e.target.value })} />
          <select value={inv.role} onChange={e => setInv({ ...inv, role: e.target.value })}>{Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn-p" disabled={busy}>{busy ? 'Criando…' : 'Criar'}</button>
        </div>
        <small className="muted">{ROLE_HINT[inv.role]} Entra com a senha provisória <b>mudar1234#</b> e cria a dela no primeiro acesso.</small>
      </form>
      {rows && (
        <div className="card flush">
          <table className="tbl"><thead><tr><th>Pessoa</th><th>Papel</th><th className="hide-m">Último acesso</th><th /></tr></thead>
            <tbody>{rows.map(u => (
              <tr key={u.id}>
                <td><b>{u.name}</b>{u.id === me.id && <span className="badge mute">você</span>}{u.pending && <span className="badge warn">convite pendente</span>}<small className="muted block">{u.email}</small></td>
                <td><select value={u.role} onChange={e => setRole(u, e.target.value)} disabled={u.id === me.id} title={ROLE_HINT[u.role]}>{Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                <td className="hide-m muted">{u.last_login_at ? fmtDate(u.last_login_at) : '—'}</td>
                <td className="row-actions">
                  <button className="link-btn" onClick={() => newLink(u)}>{u.pending ? 'Reenviar convite' : 'Nova senha'}</button>
                  {u.id !== me.id && <button className="icon-btn danger" onClick={() => remove(u)} aria-label="Remover acesso" title="Remover acesso"><Icon n="trash" s={16} /></button>}
                </td>
              </tr>
            ))}</tbody></table>
        </div>
      )}
      {linkInfo && <LinkBox info={linkInfo} onClose={() => setLinkInfo(null)} />}
    </div>
  )
}

// ------------------------------------------------------------------ Perfil
export function Profile({ me, setMe }) {
  const [name, setName] = useState(me.name)
  const [pw, setPw] = useState({ current: '', password: '' })
  const saveName = async e => {
    e.preventDefault()
    try { await call('/admin/me', { method: 'PATCH', body: { name } }); setMe({ ...me, name }); toast('Nome atualizado.') } catch (err) { toast(err.message, true) }
  }
  const savePw = async e => {
    e.preventDefault()
    if (pw.password.length < 8) return toast('Use pelo menos 8 caracteres.', true)
    try { await call('/admin/me', { method: 'POST', body: pw }); setPw({ current: '', password: '' }); toast('Senha alterada.') } catch (err) { toast(err.message, true) }
  }
  return (
    <div className="page narrow">
      <Head title="Meu perfil" sub={`${me.email} · ${ROLES[me.role]}`} />
      <form className="card form" onSubmit={saveName}>
        <label className="fld"><span>Nome</span><input value={name} onChange={e => setName(e.target.value)} /><small>É o nome que aparece como assinatura nos posts novos e nas respostas a comentários.</small></label>
        <button className="btn-p">Salvar nome</button>
      </form>
      <form className="card form" onSubmit={savePw}>
        <label className="fld"><span>Senha atual</span><input type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} /></label>
        <label className="fld"><span>Nova senha</span><input type="password" autoComplete="new-password" value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
        <button className="btn-p">Alterar senha</button>
      </form>
    </div>
  )
}
