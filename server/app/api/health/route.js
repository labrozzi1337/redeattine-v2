import { route } from '@/lib/http'
import { db, must } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Confere se o back-end alcança o banco (schema exposto, permissões e tabelas).
export const GET = route(async () => {
  must(await db.from('categories').select('id').limit(1)) // pedido normal: em caso de erro, vem o motivo
  return { ok: true }
})
