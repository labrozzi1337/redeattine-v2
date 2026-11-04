import { NextResponse } from 'next/server'
import { route, body, fail } from '@/lib/http'
import { db, must, nowIso } from '@/lib/db'
import { checkPassword, sessionCookie, publicUser } from '@/lib/auth'

// 5 tentativas erradas bloqueiam a conta por 15 minutos.
export const POST = route(async req => {
  const b = await body(req)
  const email = String(b.email || '').trim().toLowerCase()
  const u = must(await db.from('users').select('*').eq('email', email).maybeSingle())
  if (u?.locked_until && new Date(u.locked_until) > new Date()) fail(429, 'Muitas tentativas. Tente de novo em alguns minutos.')
  if (!u || !checkPassword(String(b.password || ''), u.password_hash)) {
    if (u) {
      const n = u.failed_logins + 1
      must(await db.from('users').update({ failed_logins: n, locked_until: n >= 5 ? new Date(Date.now() + 15 * 6e4).toISOString() : null }).eq('id', u.id))
    }
    fail(401, 'E-mail ou senha incorretos.')
  }
  must(await db.from('users').update({ failed_logins: 0, locked_until: null, last_login_at: nowIso() }).eq('id', u.id))
  return sessionCookie(NextResponse.json({ user: publicUser(u) }), u)
})
