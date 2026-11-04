import { route } from '@/lib/http'
import { sql, t } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = route(() => sql`select id, name, slug from ${t('categories')} order by name`)
