import { route, body } from '@/lib/http'
import { db, must } from '@/lib/db'
import { createLink } from '@/lib/auth'
import { mailOn, sendMail, resetText } from '@/lib/mail'

// Resposta igual exista ou não o e-mail (não revela quem tem acesso).
export const POST = route(async req => {
  if (!mailOn()) return { ok: true, mail: false }
  const email = String((await body(req)).email || '').trim().toLowerCase()
  const u = must(await db.from('users').select('id, name, email').eq('email', email).maybeSingle())
  if (u) await sendMail(u.email, 'Nova senha do painel da Rede Attini', resetText(u.name, await createLink(u.id, 'reset')))
  return { ok: true, mail: true }
})
