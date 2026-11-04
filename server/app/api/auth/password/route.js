import { NextResponse } from 'next/server'
import { route, body } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { consumeLink, hashPassword, validPassword, sessionCookie, publicUser } from '@/lib/auth'

// Criar senha pelo link de convite ou de nova senha. Já entra no painel em seguida.
export const POST = route(async req => {
  const b = await body(req)
  validPassword(b.password)
  const userId = await consumeLink(b.token)
  const [u] = await sql`update ${t('users')} set password_hash = ${hashPassword(b.password)}, session_version = session_version + 1,
    must_change_password = false, failed_logins = 0, locked_until = null, last_login_at = now() where id = ${userId} returning id, email, name, role, session_version, must_change_password`
  return sessionCookie(NextResponse.json({ user: publicUser(u) }), u)
})
