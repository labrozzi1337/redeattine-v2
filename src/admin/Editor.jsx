import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { Icon, Switch, Badge, toast, slugify, plain, statusOf, fmtDateTime, fmtN, call } from './ui'
import { MediaPicker } from './pages'

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', cover_url: '', cover_alt: '', status: 'draft', published_at: null,
  category_id: null, tags: [], show_home: true, show_stories: false, featured: false, seo_title: '', seo_description: '', author_name: '',
}
const FIELDS = Object.keys(EMPTY)
const pick = p => Object.fromEntries(FIELDS.map(k => [k, p[k] ?? EMPTY[k]]))
const toLocal = iso => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const fromLocal = v => v ? new Date(v).toISOString() : null

function Toolbar({ editor, onImage }) {
  if (!editor) return null
  const c = () => editor.chain().focus()
  const B = (n, title, run, active) => (
    <button type="button" title={title} aria-label={title} aria-pressed={!!active} className={active ? 'on' : ''} onMouseDown={e => e.preventDefault()} onClick={run}><Icon n={n} /></button>
  )
  const block = [2, 3, 4].find(l => editor.isActive('heading', { level: l }))
  const link = () => {
    const url = prompt('Endereço do link (deixe vazio para remover):', editor.getAttributes('link').href || 'https://')
    if (url === null) return
    url && url !== 'https://' ? c().extendMarkRange('link').setLink({ href: url }).run() : c().extendMarkRange('link').unsetLink().run()
  }
  const video = () => {
    const url = prompt('Cole o link do vídeo do YouTube:')
    if (url && !editor.commands.setYoutubeVideo({ src: url })) toast('Esse link não parece ser do YouTube.', true)
  }
  return (
    <div className="tb" role="toolbar" aria-label="Formatação">
      <select value={block || 'p'} aria-label="Tipo de texto" onChange={e => e.target.value === 'p' ? c().setParagraph().run() : c().setHeading({ level: +e.target.value }).run()}>
        <option value="p">Texto normal</option><option value="2">Título</option><option value="3">Subtítulo</option><option value="4">Título pequeno</option>
      </select>
      <i />
      {B('bold', 'Negrito (Ctrl+B)', () => c().toggleBold().run(), editor.isActive('bold'))}
      {B('italic', 'Itálico (Ctrl+I)', () => c().toggleItalic().run(), editor.isActive('italic'))}
      {B('link', 'Link (Ctrl+K)', link, editor.isActive('link'))}
      <i />
      {B('list', 'Lista', () => c().toggleBulletList().run(), editor.isActive('bulletList'))}
      {B('ordered', 'Lista numerada', () => c().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {B('quote', 'Citação', () => c().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {B('minus', 'Linha divisória', () => c().setHorizontalRule().run())}
      <i />
      {B('image', 'Imagem', onImage)}
      {B('video', 'Vídeo do YouTube', video)}
      <i />
      {B('undo', 'Desfazer (Ctrl+Z)', () => c().undo().run())}
      {B('redo', 'Refazer (Ctrl+Shift+Z)', () => c().redo().run())}
    </div>
  )
}

const Panel = ({ title, children, open = true }) => <details className="panel" open={open}><summary>{title}</summary><div className="panel-in">{children}</div></details>

export default function Editor({ id: routeId, me }) {
  const [id, setId] = useState(routeId === 'novo' ? null : routeId)
  const [raw, setRaw] = useState(null)      // o que veio do banco (ou de uma revisão)
  const [saved, setSaved] = useState(null)  // última versão salva, para status e botões
  const [f, setF] = useState(null)          // o formulário
  const [cats, setCats] = useState([])
  const [revs, setRevs] = useState([])
  const [views, setViews] = useState(null)
  const [picker, setPicker] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tagText, setTagText] = useState('')
  const base = useRef(null)
  const pub = me.role !== 'author'
  const live = saved?.status === 'published'
  const canEdit = pub || !live

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener', target: '_blank' } }),
      Image, Youtube.configure({ nocookie: true }),
      Placeholder.configure({ placeholder: 'Comece a escrever aqui. Use a barra acima para títulos, listas, imagens e vídeos.' }),
    ],
    onUpdate: ({ editor }) => setF(x => x && { ...x, content: editor.getHTML() }),
  })

  const loadRevs = pid => call(`/admin/posts/${pid}/revisions`).then(setRevs).catch(() => {})

  useEffect(() => {
    call('/categories').then(setCats).catch(() => {})
    if (!id) { const p = { ...EMPTY, author_name: me.name }; setSaved(p); setRaw(p); return }
    call('/admin/posts/' + id).then(data => { setSaved(data); setRaw(data); setViews(data.views_30d) }).catch(() => setRaw(false))
    loadRevs(id)
  }, [])

  // O editor normaliza o HTML ao carregar; a versão normalizada vira a base para saber se houve mudança.
  useEffect(() => {
    if (!editor || !raw) return
    editor.commands.setContent(raw.content || '', false)
    const p = { ...pick(raw), content: editor.getHTML() }
    if (!raw.restored) base.current = p
    setF(p)
  }, [editor, raw])

  const dirty = !!(f && base.current && FIELDS.some(k => JSON.stringify(f[k]) !== JSON.stringify(base.current[k])))
  useEffect(() => {
    window.__dirty = dirty
    const h = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    addEventListener('beforeunload', h)
    return () => { removeEventListener('beforeunload', h); window.__dirty = false }
  }, [dirty])

  const save = async status => {
    if (!f.title.trim()) return toast('Dê um título ao post antes de salvar.', true)
    const row = { ...f, status, slug: f.slug || slugify(f.title) }
    if (!row.slug) return toast('Preencha o endereço do post.', true)
    if (!row.excerpt.trim()) row.excerpt = plain(row.content).slice(0, 200)
    if (status === 'published' && !row.published_at) row.published_at = new Date().toISOString()
    setSaving(true)
    let data
    try {
      data = await (id ? call('/admin/posts/' + id, { method: 'PATCH', body: row }) : call('/admin/posts', { method: 'POST', body: row }))
    } catch (err) {
      return toast(err.status === 409 ? 'Já existe um post com esse endereço. Mude o campo "Endereço".' : err.message, true)
    } finally { setSaving(false) }
    const next = { ...pick(data), content: f.content }
    base.current = next; setF(next); setSaved(data)
    if (!id) { setId(data.id); setViews(0); history.replaceState(null, '', '#/posts/' + data.id) }
    loadRevs(data.id)
    const st = statusOf(data)
    toast(st === 'published' ? (saved.status === 'published' ? 'Post atualizado no site.' : 'Post publicado!') : st === 'scheduled' ? `Agendado para ${fmtDateTime(data.published_at)}.` : st === 'pending' ? 'Enviado para revisão.' : 'Rascunho salvo.')
    return data
  }

  // Ctrl+S salva mantendo o status atual
  useEffect(() => {
    const h = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); f && !saving && canEdit && save(saved.status) } }
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  })

  useEffect(() => { editor?.setEditable(canEdit) }, [editor, canEdit])

  if (raw === false) return <div className="page"><p className="empty">Post não encontrado. <a href="#/posts">Voltar aos posts</a></p></div>
  if (!f) return <div className="page"><p className="empty">Carregando…</p></div>

  const set = k => v => setF(x => ({ ...x, [k]: v }))
  // O endereço acompanha o título enquanto o post não foi publicado e ninguém mexeu nele à mão.
  const setTitle = v => setF(x => ({ ...x, title: v, ...(!live && x.slug === slugify(x.title) ? { slug: slugify(v) } : {}) }))
  const future = f.published_at && new Date(f.published_at) > new Date()
  const preview = async () => {
    const w = window.open('about:blank')
    let p = saved
    if (dirty && !live) p = await save(saved.status === 'draft' || !id ? 'draft' : saved.status)
    else if (dirty) toast('A pré-visualização mostra a versão salva. Clique em Atualizar para levar as mudanças ao site.')
    if (!p?.slug) return w.close()
    w.location = `/blog/${p.slug}`
  }
  const remove = async () => {
    if (!confirm(`Excluir "${f.title || 'sem título'}" definitivamente? Isso não pode ser desfeito.`)) return
    try { await call('/admin/posts/' + id, { method: 'DELETE' }) } catch (err) { return toast(err.message, true) }
    window.__dirty = false; toast('Post excluído.'); location.hash = '/posts'
  }
  const addTags = v => {
    const t = v.split(',').map(s => s.trim()).filter(s => s && !f.tags.includes(s))
    if (t.length) set('tags')([...f.tags, ...t])
    setTagText('')
  }
  const restore = r => {
    if (dirty && !confirm('Você tem alterações não salvas. Trocar pelo conteúdo desta revisão?')) return
    setRaw({ ...f, title: r.title, excerpt: r.excerpt, content: r.content, restored: true })
    toast('Revisão carregada. Salve para confirmar.')
  }

  // Botões conforme o papel e o status
  const actions = pub
    ? live
      ? [['Atualizar', () => save('published'), true]]
      : [['Salvar rascunho', () => save('draft')], [future ? 'Agendar' : 'Publicar', () => save('published'), true]]
    : saved.status === 'pending'
      ? [['Salvar', () => save('pending')], ['Voltar para rascunho', () => save('draft')]]
      : live ? [] : [['Salvar rascunho', () => save('draft')], ['Enviar para revisão', () => save('pending'), true]]

  const seoTitle = f.seo_title || f.title || 'Título do post'
  const seoDesc = f.seo_description || f.excerpt || plain(f.content).slice(0, 160) || 'O resumo do post aparece aqui.'

  return (
    <div className="ed">
      <div className="ed-bar">
        <a href="#/posts" className="ghost-btn"><Icon n="back" /> Posts</a>
        <p className="ed-state">
          <Badge p={saved} />
          {saving ? 'Salvando…' : dirty ? <span className="warn-txt">Alterações não salvas</span> : id ? `Salvo ${fmtDateTime(saved.updated_at)}` : 'Novo post'}
        </p>
        <div className="ed-actions">
          {(id || dirty) && <button className="ghost-btn" onClick={preview}><Icon n="eye" /> Visualizar</button>}
          {actions.map(([l, fn, primary]) => <button key={l} className={primary ? 'btn-p' : 'btn-s'} disabled={saving} onClick={fn}>{l}</button>)}
        </div>
      </div>
      {!canEdit && <p className="note">Este post já está publicado. Para alterar, peça a um editor.</p>}
      {!pub && saved.status === 'pending' && <p className="note">Aguardando revisão de um editor. Você ainda pode ajustar o texto.</p>}

      <div className="ed-grid">
        <div className="ed-main">
          <textarea className="ed-title" rows={1} placeholder="Título do post" value={f.title} readOnly={!canEdit}
            onChange={e => setTitle(e.target.value)} onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }} />
          <div className="ed-doc">
            {canEdit && <Toolbar editor={editor} onImage={() => setPicker('content')} />}
            <EditorContent editor={editor} className="ed-content" />
          </div>
        </div>

        <aside className="ed-side">
          <Panel title="Publicação">
            <p className="kv"><span>Status</span><Badge p={saved} /></p>
            {id && <p className="kv"><span>Visualizações (30 dias)</span><b>{views === null ? '…' : fmtN(views)}</b></p>}
            <label className="fld">
              <span>Data de publicação</span>
              <input type="datetime-local" value={toLocal(f.published_at)} onChange={e => set('published_at')(fromLocal(e.target.value))} disabled={!pub} />
              <small>{f.published_at ? future ? 'Data futura: o post entra no ar sozinho nesse horário.' : 'Aparece com esta data no site.' : 'Vazio: publica na hora em que você clicar.'}</small>
            </label>
            <label className="fld"><span>Assinatura</span><input value={f.author_name} onChange={e => set('author_name')(e.target.value)} placeholder="Rede Attini" /></label>
            {pub && live && <button className="link-btn" onClick={() => confirm('Tirar o post do ar? Ele volta a ser rascunho.') && save('draft')}>Despublicar</button>}
            {id && (pub || !live) && <button className="link-btn danger" onClick={remove}><Icon n="trash" s={15} /> Excluir post</button>}
          </Panel>

          <Panel title="Onde exibir">
            <Switch on label="Página do blog" hint="Todo post publicado aparece em /blog." disabled onChange={() => {}} />
            <Switch on={f.show_home} onChange={set('show_home')} disabled={!pub} label="Home: seção Blog" hint="Entre os 5 mais recentes da home." />
            <Switch on={f.show_stories} onChange={set('show_stories')} disabled={!pub} label="Home: Histórias da rede" hint="Vira um card de história. A 1ª tag vira a etiqueta." />
            <Switch on={f.featured} onChange={set('featured')} disabled={!pub} label="Destaque" hint="Aparece primeiro e em tamanho grande nas seções acima." />
            {!pub && <small className="muted">Um editor decide onde o post aparece.</small>}
          </Panel>

          <Panel title="Imagem de capa">
            {f.cover_url
              ? <div className="cover"><img src={f.cover_url} alt="" /><div><button className="btn-s" onClick={() => setPicker('cover')}>Trocar</button><button className="link-btn danger" onClick={() => set('cover_url')('')}>Remover</button></div></div>
              : <button className="drop small" onClick={() => setPicker('cover')}><Icon n="image" s={22} />Escolher imagem de capa</button>}
            <label className="fld"><span>Descrição da imagem</span><input value={f.cover_alt} onChange={e => set('cover_alt')(e.target.value)} placeholder="Ex.: Lojistas no Conexão Attini" /><small>Ajuda quem usa leitor de tela e o Google.</small></label>
          </Panel>

          <Panel title="Resumo">
            <textarea rows={4} value={f.excerpt} onChange={e => set('excerpt')(e.target.value)} placeholder="Duas ou três frases que fazem a pessoa querer ler. Aparece nos cards do site." />
            <small className={f.excerpt.length > 220 ? 'warn-txt' : 'muted'}>{f.excerpt.length} caracteres{f.excerpt ? '' : ' · vazio: usamos o começo do texto'}</small>
          </Panel>

          <Panel title="Categoria e tags">
            <label className="fld"><span>Categoria</span>
              <select value={f.category_id || ''} onChange={e => set('category_id')(e.target.value || null)}>
                <option value="">Sem categoria</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="fld"><span>Tags</span>
              <div className="tags">
                {f.tags.map(t => <button key={t} type="button" onClick={() => set('tags')(f.tags.filter(x => x !== t))} title="Remover">{t} <Icon n="x" s={12} /></button>)}
                <input value={tagText} onChange={e => setTagText(e.target.value)} placeholder="Digite e tecle Enter"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTags(tagText) } }} onBlur={() => tagText && addTags(tagText)} />
              </div>
            </div>
          </Panel>

          <Panel title="Endereço e Google" open={false}>
            <label className="fld"><span>Endereço</span>
              <div className="slug"><em>/blog/</em><input value={f.slug} onChange={e => set('slug')(slugify(e.target.value))} /></div>
              {live && base.current.slug !== f.slug && <small className="warn-txt">Mudar o endereço quebra links que já foram compartilhados.</small>}
            </label>
            <label className="fld"><span>Título no Google</span><input value={f.seo_title} onChange={e => set('seo_title')(e.target.value)} placeholder={f.title} /><small className={seoTitle.length > 60 ? 'warn-txt' : 'muted'}>{seoTitle.length}/60</small></label>
            <label className="fld"><span>Descrição no Google</span><textarea rows={3} value={f.seo_description} onChange={e => set('seo_description')(e.target.value)} placeholder="Usa o resumo se ficar vazio." /><small className={seoDesc.length > 160 ? 'warn-txt' : 'muted'}>{seoDesc.length}/160</small></label>
            <div className="serp">
              <small>redeattini.com.br › blog › {f.slug || 'endereco-do-post'}</small>
              <b>{seoTitle.slice(0, 60)}{seoTitle.length > 60 ? '…' : ''} | Blog Rede Attini</b>
              <p>{seoDesc.slice(0, 160)}{seoDesc.length > 160 ? '…' : ''}</p>
            </div>
          </Panel>

          {revs.length > 0 && (
            <Panel title={`Revisões (${revs.length})`} open={false}>
              <ul className="revs">
                {revs.map(r => <li key={r.id}><span>{fmtDateTime(r.saved_at)}<small>{r.saver || 'Importado'}</small></span>{canEdit && <button className="link-btn" onClick={() => restore(r)}>Restaurar</button>}</li>)}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      {picker && (
        <MediaPicker onClose={() => setPicker(null)} onPick={m => {
          if (picker === 'cover') setF(x => ({ ...x, cover_url: m.url, cover_alt: x.cover_alt || m.alt }))
          else editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run()
          setPicker(null)
        }} />
      )}
    </div>
  )
}
