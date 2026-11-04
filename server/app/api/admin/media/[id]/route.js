import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser, canPublish } from '@/lib/auth'
import { remove } from '@/lib/storage'

const find = async id => (await sql`select * from ${t('media')} where id = ${id}`)[0] || fail(404, 'Imagem não encontrada.')

// Onde a imagem está sendo usada
export const GET = route(async (req, { id }) => {
  await requireUser(req)
  const m = await find(id)
  return sql`select id, title from ${t('posts')} where cover_url = ${m.url} or content like ${'%' + m.path + '%'}`
})

export const PATCH = route(async (req, { id }) => {
  await requireUser(req)
  await sql`update ${t('media')} set alt = ${String((await body(req)).alt || '').slice(0, 300)} where id = ${id}`
  return { ok: true }
})

export const DELETE = route(async (req, { id }) => {
  const u = await requireUser(req)
  const m = await find(id)
  if (!canPublish(u) && m.uploaded_by !== u.id) fail(403, 'Só quem enviou ou um editor pode excluir esta imagem.')
  await remove(m.path)
  await sql`delete from ${t('media')} where id = ${id}`
  return { ok: true }
})
