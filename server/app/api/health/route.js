import { route } from '@/lib/http'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = route(async () => { await sql`select 1`; return { ok: true } })
