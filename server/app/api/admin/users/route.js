import { route, body, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser, createLink, ROLES } from '@/lib/auth'
import { sendMail, inviteText } from '@/lib/mail'

export const GET = route(async req => {
  await requireUser(req, ['admin'])
  return sql`select id, email, name, role, created_at, last_login_at, (password_hash is null) as pending from ${t('users')} order by created_at`
})

// Convite: cria a pessoa e devolve o link para criar a senha (e envia por e-mail, se houver SMTP).
export const POST = route(async req => {
  await requireUser(req, ['admin'])
  const b = await body(req)
  const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'E-mail inválido.')
  if (!ROLES.includes(b.role)) fail(400, 'Papel inválido.')
  const [exists] = await sql`select id from ${t('users')} where email = ${email}`
  if (exists) fail(409, 'Esse e-mail já tem acesso.')
  const [u] = await sql`insert into ${t('users')} (email, name, role) values (${email}, ${name || email.split('@')[0]}, ${b.role}) returning id, name, email`
  const link = await createLink(u.id, 'invite')
  const emailed = await sendMail(u.email, 'Convite para o painel do blog da Rede Attini', inviteText(u.name, link)).catch(() => false)
  return { link, emailed }
})
