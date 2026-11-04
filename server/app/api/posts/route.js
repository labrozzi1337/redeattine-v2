import { route, query } from '@/lib/http'
import { listPublished } from '@/lib/blog'

export const dynamic = 'force-dynamic'

// Posts publicados: /api/posts?home=1 | stories=1 | category=slug | q=busca | from | limit
export const GET = route(async req => {
  const q = query(req)
  return listPublished({ home: q.home === '1', stories: q.stories === '1', category: q.category, q: q.q, from: q.from, limit: q.limit })
})
