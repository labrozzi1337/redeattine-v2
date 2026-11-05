import { route, body, fail } from '@/lib/http'
import { db, must } from '@/lib/db'
import { requireUser, hashPassword, ROLES } from '@/lib/auth'

// Senha provisória de quem é criado pelo painel: o primeiro login obriga a trocar.
const TEMP_PASSWORD = 'mudar1234#'

export const GET = route(async req => {
  await requireUser(req, ['admin'])
  const rows = must(await db.from('users').select('id, email, name, role, created_at, last_login_at, password_hash').order('created_at'))
  return rows.map(({ password_hash, ...u }) => ({ ...u, pending: !password_hash }))
})

// Cria a pessoa já com a senha provisória (sem convite por link).
export const POST = route(async req => {
  await requireUser(req, ['admin'])
  const b = await body(req)
  const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'E-mail inválido.')
  if (!ROLES.includes(b.role)) fail(400, 'Papel inválido.')
  if (must(await db.from('users').select('id').eq('email', email).maybeSingle())) fail(409, 'Esse e-mail já tem acesso.')
  const u = must(await db.from('users').insert({ email, name: name || email.split('@')[0], role: b.role, password_hash: hashPassword(TEMP_PASSWORD), must_change_password: true }).select('id, name, email').single())
  return { ...u, password: TEMP_PASSWORD }
})
