import { useEffect, useState } from 'react'
import { Icon, Toasts, toast, ROLES, call } from './ui'
import Editor from './Editor'
import { Dashboard, Posts, Media, Comments, Categories, Users, Profile } from './pages'

// Rotas pelo # (ex.: /admin/#/posts): não exige configuração nenhuma na hospedagem.
const useRoute = () => {
  const read = () => location.hash.slice(1).split('?')[0] || '/'
  const [r, setR] = useState(read)
  useEffect(() => { const h = () => setR(read()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  return r
}

const Brand = () => <div className="brand"><img src="/logo-attini.png" alt="Rede Attini" /><span>Blog</span></div>

function Login({ onIn }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMsg('')
    try {
      if (mode === 'login') return onIn((await call('/auth/login', { method: 'POST', body: { email, password: pw } })).user)
      const r = await call('/auth/forgot', { method: 'POST', body: { email } })
      setMsg(r.mail ? 'Se esse e-mail tiver acesso, enviamos um link para criar uma nova senha.' : 'O envio de e-mail ainda não está ativo. Peça a um administrador um link de nova senha (Usuários → Nova senha).')
    } catch (err) { setMsg(err.message) } finally { setBusy(false) }
  }
  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <Brand />
        <h1>{mode === 'login' ? 'Entrar no painel' : 'Esqueci minha senha'}</h1>
        <label className="fld"><span>E-mail</span><input type="email" required autoComplete="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} /></label>
        {mode === 'login' && <label className="fld"><span>Senha</span><input type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></label>}
        {msg && <p className={`auth-msg ${mode === 'login' ? 'bad' : ''}`}>{msg}</p>}
        <button className="btn-p big" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Enviar link'}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setMsg('') }}>
          {mode === 'login' ? 'Esqueci minha senha' : '← Voltar para o login'}
        </button>
      </form>
    </div>
  )
}

// Página do link de convite / nova senha: /admin/#/senha?token=...&tipo=convite|nova
function SetPassword({ onIn }) {
  const q = new URLSearchParams(location.hash.split('?')[1])
  const invited = q.get('tipo') === 'convite'
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async e => {
    e.preventDefault()
    if (pw.length < 8) return setMsg('Use pelo menos 8 caracteres.')
    if (pw !== pw2) return setMsg('As senhas não são iguais.')
    try {
      const { user } = await call('/auth/password', { method: 'POST', body: { token: q.get('token'), password: pw } })
      history.replaceState(null, '', '/admin/#/'); toast('Senha criada. Bem-vindo(a)!'); onIn(user)
    } catch (err) { setMsg(err.message) }
  }
  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <Brand />
        <h1>{invited ? 'Crie sua senha' : 'Nova senha'}</h1>
        {invited && <p className="muted">Você foi convidado(a) para o blog da Rede Attini. Defina uma senha para entrar.</p>}
        <label className="fld"><span>Senha</span><input type="password" required autoComplete="new-password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
        <label className="fld"><span>Repita a senha</span><input type="password" required autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>
        {msg && <p className="auth-msg bad">{msg}</p>}
        <button className="btn-p big">Salvar e entrar</button>
      </form>
    </div>
  )
}

function Shell({ me, setMe }) {
  const route = useRoute()
  const [open, setOpen] = useState(false)
  const [badge, setBadge] = useState({})
  const pub = me.role !== 'author'

  useEffect(() => {
    setOpen(false)
    if (!pub) return
    call('/admin/counts').then(c => setBadge({ '/posts': c.posts, '/comentarios': c.comments })).catch(() => {})
  }, [route])

  const nav = [
    ['/', 'Painel', 'dashboard'],
    ['/posts', 'Posts', 'file'],
    ['/posts/novo', 'Escrever post', 'plus'],
    ['/midia', 'Mídia', 'image'],
    pub && ['/comentarios', 'Comentários', 'message'],
    pub && ['/categorias', 'Categorias', 'tag'],
    me.role === 'admin' && ['/usuarios', 'Usuários', 'users'],
  ].filter(Boolean)
  const active = p => p === '/' ? route === '/' : p === '/posts' ? route === '/posts' || (route.startsWith('/posts/') && route !== '/posts/novo') : route === p
  const guard = e => { if (window.__dirty && !confirm('Há alterações não salvas neste post. Sair mesmo assim?')) e.preventDefault() }

  const page = route === '/' ? <Dashboard me={me} />
    : route === '/posts' ? <Posts me={me} />
    : route.startsWith('/posts/') ? <Editor key={route} id={route.slice(7)} me={me} />
    : route === '/midia' ? <Media me={me} />
    : route === '/comentarios' && pub ? <Comments me={me} />
    : route === '/categorias' && pub ? <Categories />
    : route === '/usuarios' && me.role === 'admin' ? <Users me={me} />
    : route === '/perfil' ? <Profile me={me} setMe={setMe} />
    : <div className="page"><p className="empty">Página não encontrada. <a href="#/">Ir para o painel</a></p></div>

  return (
    <div className={`shell ${open ? 'menu-open' : ''}`}>
      <aside className="side">
        <Brand />
        <nav onClick={guard}>
          {nav.map(([p, l, i]) => (
            <a key={p} href={'#' + p} className={active(p) ? 'on' : ''}><Icon n={i} />{l}{badge[p] > 0 && <span className="count">{badge[p]}</span>}</a>
          ))}
        </nav>
        <div className="side-foot" onClick={guard}>
          <a href="/" target="_blank" rel="noopener"><Icon n="external" />Ver o site</a>
          <a href="#/perfil" className={route === '/perfil' ? 'on' : ''}><Icon n="user" /><span>{me.name}<small>{ROLES[me.role]}</small></span></a>
          <button onClick={() => call('/auth/logout', { method: 'POST' }).finally(() => setMe(null))}><Icon n="logout" />Sair</button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar"><button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Icon n="menu" /></button><Brand /></header>
        {page}
      </div>
      <div className="scrim" onClick={() => setOpen(false)} />
    </div>
  )
}

export default function Admin() {
  const [me, setMe] = useState()
  const [link, setLink] = useState(() => location.hash.startsWith('#/senha'))

  useEffect(() => {
    call('/auth/me').then(r => setMe(r.user)).catch(() => setMe(null))
    // Sessão expirou no meio do uso: volta para o login
    const out = () => setMe(null)
    addEventListener('adm-logout', out)
    return () => removeEventListener('adm-logout', out)
  }, [])

  const onIn = user => { setLink(false); setMe(user) }
  if (link) return <><SetPassword onIn={onIn} /><Toasts /></>
  if (me === undefined) return <div className="auth"><Brand /></div>
  if (!me) return <><Login onIn={onIn} /><Toasts /></>
  return <><Shell me={me} setMe={setMe} /><Toasts /></>
}
