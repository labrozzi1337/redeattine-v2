import { NextResponse } from 'next/server'
import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { checkPassword, sessionCookie } from '@/lib/auth'

// 5 tentativas erradas bloqueiam a conta por 15 minutos.
export const POST = route(async req => {
  const b = await body(req)
  const email = String(b.email || '').trim().toLowerCase()
  const [u] = await sql`select * from ${t('users')} where email = ${email}`
  if (u?.locked_until > new Date()) fail(429, 'Muitas tentativas. Tente de novo em alguns minutos.')
  if (!u || !checkPassword(String(b.password || ''), u.password_hash)) {
    if (u) await sql`update ${t('users')} set failed_logins = failed_logins + 1,
      locked_until = case when failed_logins + 1 >= 5 then now() + interval '15 minutes' end where id = ${u.id}`
    fail(401, 'E-mail ou senha incorretos.')
  }
  await sql`update ${t('users')} set failed_logins = 0, locked_until = null, last_login_at = now() where id = ${u.id}`
  return sessionCookie(NextResponse.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role } }), u)
})
