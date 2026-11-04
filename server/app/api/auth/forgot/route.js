import { route, body } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { createLink } from '@/lib/auth'
import { mailOn, sendMail, resetText } from '@/lib/mail'

// Resposta igual exista ou não o e-mail (não revela quem tem acesso).
export const POST = route(async req => {
  if (!mailOn()) return { ok: true, mail: false }
  const email = String((await body(req)).email || '').trim().toLowerCase()
  const [u] = await sql`select id, name, email from ${t('users')} where email = ${email}`
  if (u) await sendMail(u.email, 'Nova senha do painel da Rede Attini', resetText(u.name, await createLink(u.id, 'reset')))
  return { ok: true, mail: true }
})
