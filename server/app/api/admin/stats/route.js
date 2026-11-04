import { route, query } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { stats } from '@/lib/blog'

export const GET = route(async req => {
  await requireUser(req)
  return stats(query(req).days)
})
