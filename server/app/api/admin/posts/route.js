import { route, body } from '@/lib/http'
import { db, must } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { createPost } from '@/lib/blog'

// Lista do painel (sem o texto, para ficar leve)
export const GET = route(async req => {
  await requireUser(req)
  return must(await db.from('posts').select('id, slug, title, status, published_at, updated_at, cover_url, author_name, author_id, category_id, show_home, show_stories, featured')
    .order('updated_at', { ascending: false }))
})

export const POST = route(async req => createPost(await requireUser(req), await body(req)))
