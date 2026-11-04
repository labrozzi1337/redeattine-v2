import { NextResponse } from 'next/server'
import { route, body } from '@/lib/http'
import { db, must, nowIso } from '@/lib/db'
import { consumeLink, hashPassword, validPassword, sessionCookie, publicUser } from '@/lib/auth'

// Criar senha pelo link de convite ou de nova senha. Já entra no painel em seguida.
export const POST = route(async req => {
  const b = await body(req)
  validPassword(b.password)
  const userId = await consumeLink(b.token)
  const cur = must(await db.from('users').select('session_version').eq('id', userId).single())
  const u = must(await db.from('users').update({
    password_hash: hashPassword(b.password), session_version: cur.session_version + 1, must_change_password: false,
    failed_logins: 0, locked_until: null, last_login_at: nowIso(),
  }).eq('id', userId).select('id, email, name, role, session_version, must_change_password').single())
  return sessionCookie(NextResponse.json({ user: publicUser(u) }), u)
})
