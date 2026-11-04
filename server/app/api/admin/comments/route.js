import { route, body, query, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const MODS = ['admin', 'editor']

export const GET = route(async req => {
  await requireUser(req, MODS)
  const status = ['pending', 'approved', 'spam'].includes(query(req).status) ? query(req).status : 'pending'
  return sql`select c.*, json_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as post
    from ${t('comments')} c join ${t('posts')} p on p.id = c.post_id
    where c.status = ${status} order by c.created_at desc`
})

// Resposta da equipe: já entra aprovada, assinada por quem respondeu. Aprova o comentário respondido.
export const POST = route(async req => {
  const u = await requireUser(req, MODS)
  const b = await body(req)
  const content = String(b.content || '').trim()
  if (content.length < 2) fail(400, 'Escreva a resposta.')
  const [c] = await sql`select id, post_id, parent_id from ${t('comments')} where id = ${b.reply_to}`
  if (!c) fail(404, 'Comentário não encontrado.')
  return sql.begin(async tx => {
    await tx`update ${t('comments')} set status = 'approved' where id = ${c.id}`
    const [row] = await tx`insert into ${t('comments')} (post_id, parent_id, author_name, content, status, user_id)
      values (${c.post_id}, ${c.parent_id || c.id}, ${u.name}, ${content}, 'approved', ${u.id}) returning *`
    return row
  })
})
