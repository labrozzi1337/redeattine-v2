import { route, fail } from '@/lib/http'
import { currentUser } from '@/lib/auth'
import { getBySlug } from '@/lib/blog'

export const GET = route(async (req, { slug }) => {
  const post = await getBySlug(slug, !!(await currentUser(req)))
  return post || fail(404, 'Post não encontrado.')
})
