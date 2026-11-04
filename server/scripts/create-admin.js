// Cria (ou reaproveita) o primeiro administrador e mostra o link para ele criar a senha.
//   npm run db:admin -- email@empresa.com.br "Nome da Pessoa"
import postgres from 'postgres'
import { randomBytes, createHash } from 'node:crypto'

const [email, name = ''] = process.argv.slice(2)
if (!/^\S+@\S+\.\S+$/.test(email || '')) { console.error('Uso: npm run db:admin -- email@empresa.com.br "Nome"'); process.exit(1) }

if (!process.env.DATABASE_URL) { console.error('Preencha DATABASE_URL em server/.env.local (Supabase > Connect > Session pooler).'); process.exit(1) }
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
const S = n => sql(`SYS_SITE_ATTINI.${n}`)
const [user] = await sql`insert into ${S('users')} (email, name, role) values (${email.toLowerCase()}, ${name || email.split('@')[0]}, 'admin')
  on conflict (email) do update set role = 'admin' returning id, name`
const token = randomBytes(32).toString('base64url')
await sql`insert into ${S('auth_tokens')} (user_id, kind, token_hash, expires_at)
  values (${user.id}, 'invite', ${createHash('sha256').update(token).digest('hex')}, now() + interval '7 days')`
const site = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
console.log(`\n${user.name} é administrador(a). Link para criar a senha (vale 7 dias):\n\n${site}/admin/#/senha?token=${token}&tipo=convite\n`)
await sql.end()
