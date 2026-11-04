import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const PATCH = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  if (!isUuid(id)) fail(404, 'Comentário não encontrado.')
  const status = (await body(req)).status
  if (!['pending', 'approved', 'spam'].includes(status)) fail(400, 'Status inválido.')
  must(await db.from('comments').update({ status }).eq('id', id))
  return { ok: true }
})

export const DELETE = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  if (!isUuid(id)) fail(404, 'Comentário não encontrado.')
  must(await db.from('comments').delete().eq('id', id))
  return { ok: true }
})
