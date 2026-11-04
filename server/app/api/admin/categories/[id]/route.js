import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { slugify } from '@/lib/blog'

export const PATCH = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  const name = String((await body(req)).name || '').trim()
  if (!slugify(name)) fail(400, 'Informe o nome da categoria.')
  await sql`update ${t('categories')} set name = ${name}, slug = ${slugify(name)} where id = ${id}`
  return { ok: true }
})

// Os posts da categoria ficam sem categoria.
export const DELETE = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  await sql`delete from ${t('categories')} where id = ${id}`
  return { ok: true }
})
