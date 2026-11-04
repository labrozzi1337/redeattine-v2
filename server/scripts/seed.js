// Carrega no banco os posts que vieram do WordPress (server/seed/blog.json + imagens), do jeito que estão.
// Pode rodar de novo: o que já existe (mesmo endereço) não é tocado.
//   npm run db:seed
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const storage = supa.storage
const db = supa.schema('SYS_SITE_ATTINI')
const must = ({ data, error }) => { if (error) throw new Error(`${error.code}: ${error.message}${error.hint ? ' (' + error.hint + ')' : ''}`); return data }
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
  up++
}
console.log(`${up} imagens no bucket "${BUCKET}".`)

// Banco (pela API do Supabase). Não sobrescreve o que já existe.
must(await db.from('media').upsert(snap.media.map(m => ({ ...m, url: base + m.path })), { onConflict: 'path', ignoreDuplicates: true }))
must(await db.from('categories').upsert(snap.categories.map(({ name, slug }) => ({ name, slug })), { onConflict: 'slug', ignoreDuplicates: true }))
const catId = Object.fromEntries(must(await db.from('categories').select('id, slug')).map(c => [c.slug, c.id]))
const catSlug = Object.fromEntries(snap.categories.map(c => [c.id, c.slug]))

const rows = snap.posts.map(p => ({ ...p, content: url(p.content), cover_url: url(p.cover_url), category_id: catId[catSlug[p.category_id]] ?? null }))
const posts = must(await db.from('posts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true }).select('id'))

// Comentários: pais antes das respostas
const parents = snap.comments.filter(c => !c.parent_id), replies = snap.comments.filter(c => c.parent_id)
const c1 = must(await db.from('comments').upsert(parents, { onConflict: 'id', ignoreDuplicates: true }).select('id'))
const c2 = must(await db.from('comments').upsert(replies, { onConflict: 'id', ignoreDuplicates: true }).select('id'))

console.log(`Pronto: ${posts.length} posts novos, ${c1.length + c2.length} comentários novos.`)
