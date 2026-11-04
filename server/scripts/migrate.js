// Aplica os arquivos de server/db/*.sql que ainda não rodaram neste banco.
//   npm run db:migrate
import postgres from 'postgres'
import { readdirSync, readFileSync } from 'node:fs'

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} })
const dir = new URL('../db/', import.meta.url)

await sql`create schema if not exists "SYS_SITE_ATTINI"`
await sql`create table if not exists "SYS_SITE_ATTINI"._migrations (name text primary key, applied_at timestamptz not null default now())`
const done = new Set((await sql`select name from "SYS_SITE_ATTINI"._migrations`).map(r => r.name))

for (const name of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(name)) { console.log('já aplicada:', name); continue }
  await sql.begin(async tx => {
    await tx.unsafe(readFileSync(new URL(name, dir), 'utf8'))
    await tx`insert into "SYS_SITE_ATTINI"._migrations (name) values (${name})`
  })
  console.log('aplicada:', name)
}
await sql.end()
