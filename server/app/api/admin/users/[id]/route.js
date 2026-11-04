import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser, ROLES } from '@/lib/auth'

const lastAdmin = async id => {
  const [{ n }] = await sql`select count(*)::int as n from ${t('users')} where role = 'admin' and id <> ${id}`
  return n === 0
}

// Trocar papel (e nome). A rede nunca fica sem administrador.
export const PATCH = route(async (req, { id }) => {
  const me = await requireUser(req, ['admin'])
  const b = await body(req)
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role)) fail(400, 'Papel inválido.')
    if (id === me.id) fail(400, 'Você não pode mudar o próprio papel.')
    const [u] = await sql`select role from ${t('users')} where id = ${id}`
    if (!u) fail(404, 'Pessoa não encontrada.')
    if (u.role === 'admin' && b.role !== 'admin' && await lastAdmin(id)) fail(400, 'A rede precisa de pelo menos um administrador.')
    await sql`update ${t('users')} set role = ${b.role} where id = ${id}`
  }
  if (b.name !== undefined && String(b.name).trim()) await sql`update ${t('users')} set name = ${String(b.name).trim()} where id = ${id}`
  return { ok: true }
})

// Remove o acesso. Os posts da pessoa continuam no blog, com a assinatura que já tinham.
export const DELETE = route(async (req, { id }) => {
  const me = await requireUser(req, ['admin'])
  if (id === me.id) fail(400, 'Você não pode remover o próprio acesso.')
  if (await lastAdmin(id) && (await sql`select 1 from ${t('users')} where id = ${id} and role = 'admin'`).length) fail(400, 'A rede precisa de pelo menos um administrador.')
  await sql`delete from ${t('users')} where id = ${id}`
  return { ok: true }
})
