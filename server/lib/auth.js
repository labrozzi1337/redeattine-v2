import { scryptSync, randomBytes, timingSafeEqual, createHmac, createHash } from 'node:crypto'
import { sql, t } from './db'
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
  const s = JSON.parse(Buffer.from(payload, 'base64url').toString())
  return s.e > Date.now() ? s : null
}

// O papel é lido do banco a cada pedido: trocar o papel ou remover a pessoa vale na hora.
export async function currentUser(req) {
  const s = readSession(req)
  if (!s) return null
  const [u] = await sql`select id, email, name, role, session_version from ${t('users')} where id = ${s.u}`
  return u && u.session_version === s.v ? u : null
}
export async function requireUser(req, roles) {
  const u = await currentUser(req)
  if (!u) fail(401, 'Sua sessão expirou. Entre de novo.')
  if (roles && !roles.includes(u.role)) fail(403, 'Você não tem permissão para isso.')
  return u
}

// ---------------------------------------------------------------- links de convite e nova senha
const tokenHash = token => createHash('sha256').update(token).digest('hex')

export async function createLink(userId, kind) {
  const token = randomBytes(32).toString('base64url')
  const hours = kind === 'invite' ? 24 * 7 : 24
  await sql`update ${t('auth_tokens')} set used_at = now() where user_id = ${userId} and used_at is null`
  await sql`insert into ${t('auth_tokens')} (user_id, kind, token_hash, expires_at) values (${userId}, ${kind}, ${tokenHash(token)}, now() + ${hours + ' hours'}::interval)`
  const site = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${site}/admin/#/senha?token=${token}&tipo=${kind === 'invite' ? 'convite' : 'nova'}`
}

export async function consumeLink(token) {
  const [row] = await sql`select id, user_id from ${t('auth_tokens')}
    where token_hash = ${tokenHash(String(token || ''))} and used_at is null and expires_at > now()`
  if (!row) fail(400, 'Esse link expirou ou já foi usado. Peça um novo ao administrador.')
  await sql`update ${t('auth_tokens')} set used_at = now() where id = ${row.id}`
  return row.user_id
}
