import { createClient } from '@supabase/supabase-js'

export const SCHEMA = 'SYS_SITE_ATTINI'

// O back-end fala com o banco pela API do Supabase usando a chave secreta (só aqui, nunca no front).
// O schema precisa estar em Supabase > Project Settings > Data API > Exposed schemas.
const make = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  db: { schema: SCHEMA }, auth: { persistSession: false, autoRefreshToken: false },
})
export const db = globalThis.__attiniDb ?? (globalThis.__attiniDb = make())

// Devolve os dados ou lança o erro do banco (a rota transforma em resposta legível).
export function must({ data, error, count }) {
  if (error) throw error
  return count !== null && count !== undefined && data === null ? count : data
}

export const nowIso = () => new Date().toISOString()
export const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''))
