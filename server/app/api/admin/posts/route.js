import { route, body } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { createPost } from '@/lib/blog'

// Lista do painel (sem o texto, para ficar leve)
export const GET = route(async req => {
  await requireUser(req)
  return sql`select id, slug, title, status, published_at, updated_at, cover_url, author_name, author_id, category_id, show_home, show_stories, featured
    from ${t('posts')} order by updated_at desc`
})

export const POST = route(async req => createPost(await requireUser(req), await body(req)))
