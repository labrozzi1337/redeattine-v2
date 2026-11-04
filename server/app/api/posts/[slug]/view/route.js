import { route, body } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { currentUser } from '@/lib/auth'

// Uma leitura do post. Visitas da equipe logada não contam.
export const POST = route(async (req, { slug }) => {
  if (await currentUser(req)) return { ok: true, ignored: true }
  const b = await body(req)
  await sql`insert into ${t('post_views')} (post_id, visitor, referrer, device)
    select id, ${String(b.visitor || '').slice(0, 64) || null}, ${String(b.referrer || '').slice(0, 120) || null}, ${b.device === 'mobile' ? 'mobile' : 'desktop'}
    from ${t('posts')} where slug = ${slug} and status = 'published' and published_at <= now()`
  return { ok: true }
})
