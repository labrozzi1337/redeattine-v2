import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { updatePost, canEditPost } from '@/lib/blog'

const find = async (id, cols = '*') => (isUuid(id) && must(await db.from('posts').select(cols).eq('id', id).maybeSingle())) || fail(404, 'Post não encontrado.')

export const GET = route(async (req, { id }) => {
  await requireUser(req)
  const p = await find(id)
  const { count } = await db.from('post_views').select('id', { count: 'exact', head: true }).eq('post_id', id).gt('created_at', new Date(Date.now() - 30 * 864e5).toISOString())
  return { ...p, views_30d: count || 0 }
})

export const PATCH = route(async (req, { id }) => updatePost(await requireUser(req), id, await body(req)))

export const DELETE = route(async (req, { id }) => {
  const u = await requireUser(req)
  const p = await find(id, 'author_id, status')
  if (!canEditPost(u, p)) fail(403, 'Você não tem permissão para excluir este post.')
  must(await db.from('posts').delete().eq('id', id))
  return { ok: true }
})
