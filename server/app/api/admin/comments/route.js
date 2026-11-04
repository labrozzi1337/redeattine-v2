import { route, body, query, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const MODS = ['admin', 'editor']

export const GET = route(async req => {
  await requireUser(req, MODS)
  const status = ['pending', 'approved', 'spam'].includes(query(req).status) ? query(req).status : 'pending'
  return must(await db.from('comments').select('*, post:posts(id, title, slug)').eq('status', status).order('created_at', { ascending: false }))
})

// Resposta da equipe: já entra aprovada, assinada por quem respondeu. Aprova o comentário respondido.
export const POST = route(async req => {
  const u = await requireUser(req, MODS)
  const b = await body(req)
  const content = String(b.content || '').trim()
  if (content.length < 2) fail(400, 'Escreva a resposta.')
  const c = (isUuid(b.reply_to) && must(await db.from('comments').select('id, post_id, parent_id').eq('id', b.reply_to).maybeSingle())) || fail(404, 'Comentário não encontrado.')
  must(await db.from('comments').update({ status: 'approved' }).eq('id', c.id))
  return must(await db.from('comments').insert({ post_id: c.post_id, parent_id: c.parent_id || c.id, author_name: u.name, content, status: 'approved', user_id: u.id }).select().single())
})
