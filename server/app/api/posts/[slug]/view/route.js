import { route, body } from '@/lib/http'
import { db, must } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { live } from '@/lib/blog'

// Uma leitura do post. Visitas da equipe logada não contam.
export const POST = route(async (req, { slug }) => {
  if (await currentUser(req)) return { ok: true, ignored: true }
  const b = await body(req)
  const post = must(await live(db.from('posts').select('id').eq('slug', String(slug))).maybeSingle())
  if (!post) return { ok: true }
  must(await db.from('post_views').insert({
    post_id: post.id, visitor: String(b.visitor || '').slice(0, 64) || null, referrer: String(b.referrer || '').slice(0, 120) || null,
    device: b.device === 'mobile' ? 'mobile' : 'desktop',
  }))
  return { ok: true }
})
