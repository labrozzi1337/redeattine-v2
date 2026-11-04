// Convida e remove usuários do blog. Roda com a service role, que nunca vai para o navegador.
// Só administradores logados conseguem chamar.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await admin.auth.getUser(jwt)
  if (!user) return json({ error: 'Faça login de novo.' }, 401)
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return json({ error: 'Só administradores gerenciam usuários.' }, 403)

  const body = await req.json().catch(() => ({}))

  if (body.action === 'invite') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const role = ['admin', 'editor', 'author'].includes(body.role) ? body.role : 'author'
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'E-mail inválido.' }, 400)
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { name }, redirectTo: body.redirectTo })
    if (error) return json({ error: error.message.includes('already') ? 'Esse e-mail já tem acesso.' : error.message }, 400)
    await admin.from('profiles').update({ role, name: name || email.split('@')[0] }).eq('id', data.user.id)
    return json({ ok: true })
  }

  if (body.action === 'delete') {
    if (body.id === user.id) return json({ error: 'Você não pode remover o próprio acesso.' }, 400)
    const { error } = await admin.auth.admin.deleteUser(body.id)
    return error ? json({ error: error.message }, 400) : json({ ok: true })
  }

  return json({ error: 'Ação desconhecida.' }, 400)
})
