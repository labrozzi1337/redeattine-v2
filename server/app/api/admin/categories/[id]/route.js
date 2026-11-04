import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { slugify } from '@/lib/blog'

export const PATCH = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  if (!isUuid(id)) fail(404, 'Categoria não encontrada.')
  const name = String((await body(req)).name || '').trim()
  if (!slugify(name)) fail(400, 'Informe o nome da categoria.')
  must(await db.from('categories').update({ name, slug: slugify(name) }).eq('id', id))
  return { ok: true }
})

// Os posts da categoria ficam sem categoria.
export const DELETE = route(async (req, { id }) => {
  await requireUser(req, ['admin', 'editor'])
  if (!isUuid(id)) fail(404, 'Categoria não encontrada.')
  must(await db.from('categories').delete().eq('id', id))
  return { ok: true }
})
