import { NextResponse } from 'next/server'
import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser, checkPassword, hashPassword, validPassword, sessionCookie } from '@/lib/auth'

// Meu perfil: nome
export const PATCH = route(async req => {
  const u = await requireUser(req)
  const name = String((await body(req)).name || '').trim()
  if (name.length < 2) fail(400, 'Informe seu nome.')
  await sql`update ${t('users')} set name = ${name} where id = ${u.id}`
  return { ok: true }
})

// Trocar a senha (pede a atual). Encerra as outras sessões abertas.
export const POST = route(async req => {
  const u = await requireUser(req)
  const b = await body(req)
  validPassword(b.password)
  const [row] = await sql`select password_hash from ${t('users')} where id = ${u.id}`
  if (!checkPassword(String(b.current || ''), row.password_hash)) fail(400, 'Senha atual incorreta.')
  const [nu] = await sql`update ${t('users')} set password_hash = ${hashPassword(b.password)}, session_version = session_version + 1
    where id = ${u.id} returning id, session_version`
  return sessionCookie(NextResponse.json({ ok: true }), nu)
})
