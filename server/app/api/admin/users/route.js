import { route, body, fail } from '@/lib/http'
import { db, must } from '@/lib/db'
import { requireUser, createLink, ROLES } from '@/lib/auth'
import { sendMail, inviteText } from '@/lib/mail'

export const GET = route(async req => {
  await requireUser(req, ['admin'])
  const rows = must(await db.from('users').select('id, email, name, role, created_at, last_login_at, password_hash').order('created_at'))
  return rows.map(({ password_hash, ...u }) => ({ ...u, pending: !password_hash }))
})

// Convite: cria a pessoa e devolve o link para criar a senha (e envia por e-mail, se houver SMTP).
export const POST = route(async req => {
  await requireUser(req, ['admin'])
  const b = await body(req)
  const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'E-mail inválido.')
  if (!ROLES.includes(b.role)) fail(400, 'Papel inválido.')
  if (must(await db.from('users').select('id').eq('email', email).maybeSingle())) fail(409, 'Esse e-mail já tem acesso.')
  const u = must(await db.from('users').insert({ email, name: name || email.split('@')[0], role: b.role }).select('id, name, email').single())
  const link = await createLink(u.id, 'invite')
  const emailed = await sendMail(u.email, 'Convite para o painel do blog da Rede Attini', inviteText(u.name, link)).catch(() => false)
  return { link, emailed }
})
