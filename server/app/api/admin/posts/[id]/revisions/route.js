import { route, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const GET = route(async (req, { id }) => {
  await requireUser(req)
  if (!isUuid(id)) fail(404, 'Post não encontrado.')
  const rows = must(await db.from('post_revisions').select('id, title, excerpt, content, saved_at, saver:users(name)').eq('post_id', id).order('saved_at', { ascending: false }))
  return rows.map(r => ({ ...r, saver: r.saver?.name || null }))
})
