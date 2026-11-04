// Cria (ou promove) um administrador e mostra o link para ele criar a senha.
//   npm run db:admin -- email@empresa.com.br "Nome da Pessoa"
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'node:crypto'

const [email, name = ''] = process.argv.slice(2)
if (!/^\S+@\S+\.\S+$/.test(email || '')) { console.error('Uso: npm run db:admin -- email@empresa.com.br "Nome"'); process.exit(1) }

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } }).schema('SYS_SITE_ATTINI')
const must = ({ data, error }) => { if (error) throw new Error(`${error.code}: ${error.message}`); return data }

const user = must(await db.from('users').upsert({ email: email.toLowerCase(), name: name || email.split('@')[0], role: 'admin' }, { onConflict: 'email' }).select('id, name').single())
const token = randomBytes(32).toString('base64url')
must(await db.from('auth_tokens').insert({ user_id: user.id, kind: 'invite', token_hash: createHash('sha256').update(token).digest('hex'), expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }))
const site = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
console.log(`\n${user.name} é administrador(a). Link para criar a senha (vale 7 dias):\n\n${site}/admin/#/senha?token=${token}&tipo=convite\n`)
