import { route, fail } from '@/lib/http'
import { db, must, isUuid } from '@/lib/db'
import { requireUser, createLink } from '@/lib/auth'
import { sendMail, inviteText, resetText } from '@/lib/mail'

// Novo link de senha para alguém (ou reenvio do convite, se a pessoa ainda não criou a senha).
export const POST = route(async (req, { id }) => {
  await requireUser(req, ['admin'])
  const u = (isUuid(id) && must(await db.from('users').select('id, name, email, password_hash').eq('id', id).maybeSingle())) || fail(404, 'Pessoa não encontrada.')
  const invite = !u.password_hash
  const link = await createLink(u.id, invite ? 'invite' : 'reset')
  const emailed = await sendMail(u.email, invite ? 'Convite para o painel do blog da Rede Attini' : 'Nova senha do painel da Rede Attini',
    (invite ? inviteText : resetText)(u.name, link)).catch(() => false)
  return { link, emailed }
})
