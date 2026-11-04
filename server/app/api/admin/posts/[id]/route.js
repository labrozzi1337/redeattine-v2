import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { updatePost, canEditPost } from '@/lib/blog'

export const GET = route(async (req, { id }) => {
  await requireUser(req)
  const [p] = await sql`select p.*, (select count(*)::int from ${t('post_views')} v where v.post_id = p.id and v.created_at > now() - interval '30 days') as views_30d
    from ${t('posts')} p where p.id = ${id}`
  return p || fail(404, 'Post não encontrado.')
})

export const PATCH = route(async (req, { id }) => updatePost(await requireUser(req), id, await body(req)))

export const DELETE = route(async (req, { id }) => {
  const u = await requireUser(req)
  const [p] = await sql`select author_id, status from ${t('posts')} where id = ${id}`
  if (!p) fail(404, 'Post não encontrado.')
  if (!canEditPost(u, p)) fail(403, 'Você não tem permissão para excluir este post.')
  await sql`delete from ${t('posts')} where id = ${id}`
  return { ok: true }
})
