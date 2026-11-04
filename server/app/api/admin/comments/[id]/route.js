import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const PATCH = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  const status = (await body(req)).status
  if (!['pending', 'approved', 'spam'].includes(status)) fail(400, 'Status inválido.')
  await sql`update ${t('comments')} set status = ${status} where id = ${id}`
  return { ok: true }
})

export const DELETE = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  await sql`delete from ${t('comments')} where id = ${id}`
  return { ok: true }
})
