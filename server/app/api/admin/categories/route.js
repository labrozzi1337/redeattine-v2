import { route, body, fail } from '@/lib/http'
import { db, must } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { slugify } from '@/lib/blog'

// Categorias com a quantidade de posts de cada uma (contada aqui no back-end)
export const GET = route(async req => {
  await requireUser(req)
  const [cats, posts] = await Promise.all([db.from('categories').select('id, name, slug').order('name'), db.from('posts').select('category_id')])
  const n = must(posts).reduce((m, p) => ({ ...m, [p.category_id]: (m[p.category_id] || 0) + 1 }), {})
  return must(cats).map(c => ({ ...c, posts: n[c.id] || 0 }))
})

export const POST = route(async req => {
  await requireUser(req, ['admin', 'editor'])
  const name = String((await body(req)).name || '').trim()
  if (!slugify(name)) fail(400, 'Informe o nome da categoria.')
  return must(await db.from('categories').insert({ name, slug: slugify(name) }).select().single())
})
