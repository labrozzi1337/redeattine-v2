import { NextResponse } from 'next/server'
import { route, body, fail } from '@/lib/http'
import { db, must } from '@/lib/db'
import { requireUser, checkPassword, hashPassword, validPassword, sessionCookie } from '@/lib/auth'

// Meu perfil: nome
export const PATCH = route(async req => {
  const u = await requireUser(req)
  const name = String((await body(req)).name || '').trim()
  if (name.length < 2) fail(400, 'Informe seu nome.')
  must(await db.from('users').update({ name }).eq('id', u.id))
  return { ok: true }
})

// Trocar a senha (pede a atual). Encerra as outras sessões abertas. Também tira a marca de senha provisória.
export const POST = route(async req => {
  const u = await requireUser(req, null, true)
  const b = await body(req)
  validPassword(b.password)
  const row = must(await db.from('users').select('password_hash, session_version').eq('id', u.id).single())
  if (!checkPassword(String(b.current || ''), row.password_hash)) fail(400, 'Senha atual incorreta.')
  if (b.current === b.password) fail(400, 'A senha nova precisa ser diferente da atual.')
  const nu = must(await db.from('users').update({ password_hash: hashPassword(b.password), session_version: row.session_version + 1, must_change_password: false })
    .eq('id', u.id).select('id, session_version').single())
  return sessionCookie(NextResponse.json({ ok: true }), nu)
})
