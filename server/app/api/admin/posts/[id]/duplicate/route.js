import { route, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { createPost, FIELDS } from '@/lib/blog'

// Cópia como rascunho, em nome de quem duplicou.
export const POST = route(async (req, { id }) => {
  const u = await requireUser(req)
  const [p] = await sql`select * from ${t('posts')} where id = ${id}`
  if (!p) fail(404, 'Post não encontrado.')
  const copy = Object.fromEntries(FIELDS.map(k => [k, p[k]]))
  return createPost(u, { ...copy, title: 'Cópia de ' + p.title, slug: `${p.slug}-copia-${Date.now().toString(36).slice(-4)}`, status: 'draft', published_at: null })
})
