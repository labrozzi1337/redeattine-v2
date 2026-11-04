import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { slugify } from '@/lib/blog'

export const GET = route(async req => {
  await requireUser(req)
  return sql`select c.id, c.name, c.slug, (select count(*)::int from ${t('posts')} p where p.category_id = c.id) as posts
    from ${t('categories')} c order by c.name`
})

export const POST = route(async req => {
  await requireUser(req, ['admin', 'editor'])
  const name = String((await body(req)).name || '').trim()
  if (!slugify(name)) fail(400, 'Informe o nome da categoria.')
  const [row] = await sql`insert into ${t('categories')} (name, slug) values (${name}, ${slugify(name)}) returning *`
  return row
})
