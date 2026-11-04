import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { live } from '@/lib/blog'

const postId = async slug => must(await live(db.from('posts').select('id').eq('slug', String(slug))).maybeSingle())?.id || fail(404, 'Post indisponível.')

// Comentários aprovados (sem e-mail de ninguém)
export const GET = route(async (req, { slug }) => {
  const id = await postId(slug)
  const rows = must(await db.from('comments').select('id, parent_id, author_name, content, user_id, created_at').eq('post_id', id).eq('status', 'approved').order('created_at'))
  return rows.map(({ user_id, ...c }) => ({ ...c, team: !!user_id }))
})

// Visitante comenta: sempre entra pendente, só aparece depois de aprovado no painel.
export const POST = route(async (req, { slug }) => {
  const id = await postId(slug)
  const b = await body(req)
  if (b.site) return { ok: true } // campo-isca preenchido: robô
  const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase(), content = String(b.content || '').trim()
  if (name.length < 2 || name.length > 80) fail(400, 'Informe seu nome.')
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'E-mail inválido.')
  if (content.length < 2 || content.length > 3000) fail(400, 'O comentário precisa ter entre 2 e 3.000 caracteres.')
  // ponytail: limite simples por e-mail; trocar por captcha se o spam passar disso.
  const { count } = await db.from('comments').select('id', { count: 'exact', head: true }).eq('author_email', email).gt('created_at', new Date(Date.now() - 36e5).toISOString())
  if (count >= 5) fail(429, 'Muitos comentários seguidos. Tente mais tarde.')
  let parent = null
  if (isUuid(b.parent_id)) parent = must(await db.from('comments').select('id').eq('id', b.parent_id).eq('post_id', id).eq('status', 'approved').maybeSingle())?.id || null
  must(await db.from('comments').insert({ post_id: id, parent_id: parent, author_name: name, author_email: email, content }))
  return { ok: true }
})
