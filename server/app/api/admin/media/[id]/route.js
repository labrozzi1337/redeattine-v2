import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser, canPublish } from '@/lib/auth'
import { remove } from '@/lib/storage'

const find = async id => (isUuid(id) && must(await db.from('media').select('*').eq('id', id).maybeSingle())) || fail(404, 'Imagem não encontrada.')

// Onde a imagem está sendo usada
export const GET = route(async (req, { id }) => {
  await requireUser(req)
  const m = await find(id)
  return must(await db.from('posts').select('id, title').or(`cover_url.eq."${m.url}",content.like."*${m.path}*"`))
})

export const PATCH = route(async (req, { id }) => {
  await requireUser(req)
  await find(id)
  must(await db.from('media').update({ alt: String((await body(req)).alt || '').slice(0, 300) }).eq('id', id))
  return { ok: true }
})

export const DELETE = route(async (req, { id }) => {
  const u = await requireUser(req)
  const m = await find(id)
  if (!canPublish(u) && m.uploaded_by !== u.id) fail(403, 'Só quem enviou ou um editor pode excluir esta imagem.')
  await remove(m.path)
  must(await db.from('media').delete().eq('id', id))
  return { ok: true }
})
