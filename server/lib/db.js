import postgres from 'postgres'

export const SCHEMA = 'SYS_SITE_ATTINI'

// Conexão direta com o Postgres. Na Vercel, use a URL do pooler em modo transação (porta 6543).
const make = () => postgres(process.env.DATABASE_URL, { prepare: false, max: 5, idle_timeout: 20, transform: { undefined: null } })
export const sql = globalThis.__attiniSql ?? (globalThis.__attiniSql = make())

// Nome de tabela já com o schema: t('posts') -> "SYS_SITE_ATTINI"."posts"
export const t = name => sql(`${SCHEMA}.${name}`)
