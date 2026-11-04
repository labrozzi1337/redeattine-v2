import { route } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const GET = route(async (req, { id }) => {
  await requireUser(req)
  return sql`select r.id, r.title, r.excerpt, r.content, r.saved_at, u.name as saver
    from ${t('post_revisions')} r left join ${t('users')} u on u.id = r.saved_by
    where r.post_id = ${id} order by r.saved_at desc`
})
