import { route } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// Contadores do menu: posts em revisão e comentários esperando moderação.
export const GET = route(async req => {
  await requireUser(req)
  const [r] = await sql`select (select count(*) from ${t('posts')} where status = 'pending')::int as posts,
    (select count(*) from ${t('comments')} where status = 'pending')::int as comments`
  return r
})
