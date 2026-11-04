import { route } from '@/lib/http'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// Contadores do menu: posts em revisão e comentários esperando moderação.
export const GET = route(async req => {
  await requireUser(req)
  const head = { count: 'exact', head: true }
  const [p, c] = await Promise.all([
    db.from('posts').select('id', head).eq('status', 'pending'),
    db.from('comments').select('id', head).eq('status', 'pending'),
  ])
  if (p.error || c.error) throw p.error || c.error
  return { posts: p.count, comments: c.count }
})
