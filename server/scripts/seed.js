// Carrega no banco os posts que vieram do WordPress (server/seed/blog.json + imagens), do jeito que estão.
// Pode rodar de novo: o que já existe (mesmo endereço) não é tocado.
//   npm run db:seed
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
const S = name => sql(`SYS_SITE_ATTINI.${name}`)
const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } }).storage
const BUCKET = 'site-attini'
const seed = new URL('../seed/', import.meta.url)
const snap = JSON.parse(readFileSync(new URL('blog.json', seed), 'utf8'))

// Bucket público só deste site
const { data: bucket } = await storage.getBucket(BUCKET)
if (!bucket) {
  const { error } = await storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 })
  if (error && !/exists/i.test(error.message)) throw error
}
const base = storage.from(BUCKET).getPublicUrl('').data.publicUrl.replace(/\/?$/, '/')
const url = s => s && s.split('{{MEDIA}}').join(base)

let up = 0
for (const m of snap.media) {
  const { error } = await storage.from(BUCKET).upload(m.path, readFileSync(new URL('media/' + m.path, seed)), { contentType: 'image/webp', cacheControl: '31536000', upsert: true })
  if (error) throw error
  await sql`insert into ${S('media')} ${sql({ ...m, url: base + m.path })} on conflict (path) do nothing`
  up++
}

for (const c of snap.categories) await sql`insert into ${S('categories')} ${sql(c)} on conflict (slug) do nothing`
const catId = Object.fromEntries((await sql`select id, slug from ${S('categories')}`).map(c => [c.slug, c.id]))
const catSlug = Object.fromEntries(snap.categories.map(c => [c.id, c.slug]))

let posts = 0
for (const p of snap.posts) {
  const row = { ...p, content: url(p.content), cover_url: url(p.cover_url), category_id: catId[catSlug[p.category_id]] ?? null }
  const r = await sql`insert into ${S('posts')} ${sql(row)} on conflict (slug) do nothing returning id`
  posts += r.length
}

// Comentários: pais antes das respostas
let comments = 0
for (const c of [...snap.comments].sort((a, b) => !!a.parent_id - !!b.parent_id)) {
  const r = await sql`insert into ${S('comments')} ${sql(c)} on conflict (id) do nothing returning id`
  comments += r.length
}

console.log(`Pronto: ${up} imagens no bucket "${BUCKET}", ${posts} posts novos, ${comments} comentários novos.`)
await sql.end()
