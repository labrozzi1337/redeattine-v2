import { useEffect, useState } from 'react'
import { sb } from '../supabase'
import { Icon, Toasts, toast, ROLES } from './ui'
import Editor from './Editor'
import { Dashboard, Posts, Media, Comments, Categories, Users, Profile } from './pages'

// Rotas pelo # (ex.: /admin/#/posts): não exige configuração nenhuma na hospedagem.
const useRoute = () => {
  const read = () => /access_token|error=/.test(location.hash) ? '/' : location.hash.slice(1).split('?')[0] || '/'
  const [r, setR] = useState(read)
  useEffect(() => { const h = () => setR(read()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  return r
}

const Brand = () => <div className="brand"><img src="/logo-attini.png" alt="Rede Attini" /><span>Blog</span></div>

function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(window.__authError ? 'Esse link expirou ou já foi usado. Peça um novo convite ou clique em "Esqueci minha senha".' : '')
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMsg('')
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw })
      if (error) setMsg(error.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : error.message)
    } else {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/' })
      setMsg(error ? error.message : 'Se esse e-mail tiver acesso, enviamos um link para criar uma nova senha.')
    }
    setBusy(false)
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

function SetPassword({ invited, onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async e => {
    e.preventDefault()
    if (pw.length < 8) return setMsg('Use pelo menos 8 caracteres.')
    if (pw !== pw2) return setMsg('As senhas não são iguais.')
    const { error } = await sb.auth.updateUser({ password: pw })
    if (error) return setMsg(error.message)
    toast('Senha criada. Bem-vindo(a)!'); onDone()
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
    Promise.all([
      sb.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([p, c]) => setBadge({ '/posts': p.count, '/comentarios': c.count }))
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
          <button onClick={() => sb.auth.signOut()}><Icon n="logout" />Sair</button>
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
  const [session, setSession] = useState()
  const [me, setMe] = useState(null)
  // Links de convite e de nova senha chegam com type=invite|recovery (capturado no admin/index.html)
  const [setPw, setSetPw] = useState(['invite', 'recovery'].includes(window.__authType) ? window.__authType : null)

  useEffect(() => {
    if (!sb) return
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = sb.auth.onAuthStateChange((ev, s) => {
      setSession(s)
      if (ev === 'PASSWORD_RECOVERY') setSetPw('recovery')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setMe(null)
    sb.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setMe(data || false))
  }, [session?.user.id])

  if (!sb) return <div className="auth"><div className="auth-card"><Brand /><h1>Blog não configurado</h1><p className="muted">Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e gere o site de novo. O passo a passo está no README.</p></div></div>
  if (session === undefined) return <div className="auth"><Brand /></div>
  if (!session) return <><Login /><Toasts /></>
  if (setPw) return <><SetPassword invited={setPw === 'invite'} onDone={() => { setSetPw(null); history.replaceState(null, '', '/admin/#/') }} /><Toasts /></>
  if (me === null) return <div className="auth"><Brand /></div>
  if (me === false) return <div className="auth"><div className="auth-card"><Brand /><h1>Sem acesso</h1><p className="muted">Seu login não tem perfil no blog. Peça a um administrador.</p><button className="btn-s" onClick={() => sb.auth.signOut()}>Sair</button></div></div>
  return <><Shell me={me} setMe={setMe} /><Toasts /></>
}
