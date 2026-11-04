import { scryptSync, randomBytes, timingSafeEqual, createHmac, createHash } from 'node:crypto'
import { db, must, nowIso, isUuid } from './db'
import { fail } from './http'

export const COOKIE = 'attini_session'
const DAYS = 14
const secret = () => process.env.SESSION_SECRET || fail(500, 'SESSION_SECRET não configurado.')

export const ROLES = ['admin', 'editor', 'author']
export const canPublish = u => u.role === 'admin' || u.role === 'editor'

// ---------------------------------------------------------------- senha
export function hashPassword(pw) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('base64')}$${scryptSync(pw, salt, 64).toString('base64')}`
}
export function checkPassword(pw, stored) {
  if (!stored) return false
  const [, salt, hash] = stored.split('$')
  const expected = Buffer.from(hash, 'base64')
  return timingSafeEqual(scryptSync(pw, Buffer.from(salt, 'base64'), expected.length), expected)
}
export const validPassword = pw => typeof pw === 'string' && pw.length >= 8 || fail(400, 'A senha precisa ter pelo menos 8 caracteres.')

// ---------------------------------------------------------------- sessão (cookie assinado)
const sign = v => createHmac('sha256', secret()).update(v).digest('base64url')

export function sessionCookie(res, user) {
  const payload = Buffer.from(JSON.stringify({ u: user.id, v: user.session_version, e: Date.now() + DAYS * 864e5 })).toString('base64url')
  res.cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'lax', path: '/api', maxAge: DAYS * 86400, secure: process.env.NODE_ENV === 'production',
  })
  return res
}
export const clearCookie = res => { res.cookies.set(COOKIE, '', { httpOnly: true, path: '/api', maxAge: 0 }); return res }

function readSession(req) {
  const raw = req.cookies.get(COOKIE)?.value
  if (!raw) return null
  const [payload, sig] = raw.split('.')
  const good = Buffer.from(sign(payload)), got = Buffer.from(sig || '')
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null
  try { const s = JSON.parse(Buffer.from(payload, 'base64url').toString()); return s.e > Date.now() && isUuid(s.u) ? s : null } catch { return null }
}

// O papel é lido do banco a cada pedido: trocar o papel ou remover a pessoa vale na hora.
export async function currentUser(req) {
  const s = readSession(req)
  if (!s) return null
  const u = must(await db.from('users').select('id, email, name, role, session_version, must_change_password').eq('id', s.u).maybeSingle())
  return u && u.session_version === s.v ? u : null
}
// Com senha provisória, a única coisa liberada é trocar a senha (passwordChange = true).
export async function requireUser(req, roles, passwordChange = false) {
  const u = await currentUser(req)
  if (!u) fail(401, 'Sua sessão expirou. Entre de novo.')
  if (u.must_change_password && !passwordChange) fail(403, 'Crie uma senha nova para continuar.')
  if (roles && !roles.includes(u.role)) fail(403, 'Você não tem permissão para isso.')
  return u
}
export const publicUser = u => ({ id: u.id, email: u.email, name: u.name, role: u.role, must_change: !!u.must_change_password })

// ---------------------------------------------------------------- links de convite e nova senha
const tokenHash = token => createHash('sha256').update(token).digest('hex')

export async function createLink(userId, kind) {
  const token = randomBytes(32).toString('base64url')
  const hours = kind === 'invite' ? 24 * 7 : 24
  must(await db.from('auth_tokens').update({ used_at: nowIso() }).eq('user_id', userId).is('used_at', null))
  must(await db.from('auth_tokens').insert({ user_id: userId, kind, token_hash: tokenHash(token), expires_at: new Date(Date.now() + hours * 36e5).toISOString() }))
  const site = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${site}/admin/#/senha?token=${token}&tipo=${kind === 'invite' ? 'convite' : 'nova'}`
}

export async function consumeLink(token) {
  const row = must(await db.from('auth_tokens').select('id, user_id').eq('token_hash', tokenHash(String(token || ''))).is('used_at', null).gt('expires_at', nowIso()).maybeSingle())
  if (!row) fail(400, 'Esse link expirou ou já foi usado. Peça um novo ao administrador.')
  must(await db.from('auth_tokens').update({ used_at: nowIso() }).eq('id', row.id))
  return row.user_id
}
