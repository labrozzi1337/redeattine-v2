import { route } from '@/lib/http'
import { db, must } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = route(async () => must(await db.from('categories').select('id, name, slug').order('name')))
