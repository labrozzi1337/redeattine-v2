import { route, body, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser, ROLES } from '@/lib/auth'

// Há outro administrador além desta pessoa?
const otherAdmins = async id => {
  const { count, error } = await db.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin').neq('id', id)
  if (error) throw error
  return count
}
const find = async id => (isUuid(id) && must(await db.from('users').select('id, role').eq('id', id).maybeSingle())) || fail(404, 'Pessoa não encontrada.')

// Trocar papel (e nome). A rede nunca fica sem administrador.
export const PATCH = route(async (req, { id }) => {
  const me = await requireUser(req, ['admin'])
  const b = await body(req)
  const u = await find(id)
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role)) fail(400, 'Papel inválido.')
    if (id === me.id) fail(400, 'Você não pode mudar o próprio papel.')
    if (u.role === 'admin' && b.role !== 'admin' && !(await otherAdmins(id))) fail(400, 'A rede precisa de pelo menos um administrador.')
    must(await db.from('users').update({ role: b.role }).eq('id', id))
  }
  if (b.name !== undefined && String(b.name).trim()) must(await db.from('users').update({ name: String(b.name).trim() }).eq('id', id))
  return { ok: true }
})

// Remove o acesso. Os posts da pessoa continuam no blog, com a assinatura que já tinham.
export const DELETE = route(async (req, { id }) => {
  const me = await requireUser(req, ['admin'])
  if (id === me.id) fail(400, 'Você não pode remover o próprio acesso.')
  const u = await find(id)
  if (u.role === 'admin' && !(await otherAdmins(id))) fail(400, 'A rede precisa de pelo menos um administrador.')
  must(await db.from('users').delete().eq('id', id))
  return { ok: true }
})
