import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'

const postId = async slug => {
  const [p] = await sql`select id from ${t('posts')} where slug = ${slug} and status = 'published' and published_at <= now()`
  return p?.id || fail(404, 'Post indisponível.')
}

// Comentários aprovados (sem e-mail de ninguém)
export const GET = route(async (req, { slug }) => {
  const id = await postId(slug)
  return sql`select id, parent_id, author_name, content, (user_id is not null) as team, created_at
    from ${t('comments')} where post_id = ${id} and status = 'approved' order by created_at`
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
  const [{ n }] = await sql`select count(*)::int as n from ${t('comments')} where author_email = ${email} and created_at > now() - interval '1 hour'`
  if (n >= 5) fail(429, 'Muitos comentários seguidos. Tente mais tarde.')
  let parent = null
  if (b.parent_id) {
    const [p] = await sql`select id from ${t('comments')} where id = ${b.parent_id} and post_id = ${id} and status = 'approved'`
    parent = p?.id || null
  }
  await sql`insert into ${t('comments')} (post_id, parent_id, author_name, author_email, content) values (${id}, ${parent}, ${name}, ${email}, ${content})`
  return { ok: true }
})
