import { db, must, nowIso, isUuid } from './db'
import { canPublish } from './auth'
import { fail } from './http'

// ---------------------------------------------------------------- leitura pública
const CARD = 'id, slug, title, excerpt, cover_url, cover_alt, published_at, tags, featured, category_id, category:categories(name, slug)'
// Publicado e já na data (agendado só aparece na hora marcada)
export const live = q => q.eq('status', 'published').lte('published_at', nowIso())
// Busca livre sem caracteres que mudam o sentido do filtro da API
const term = q => String(q || '').replace(/[%*,().:"\\]/g, ' ').trim().slice(0, 80)

export async function listPublished({ home, stories, category, q, from = 0, limit = 12 }) {
  let query = live(db.from('posts').select(CARD))
  if (home) query = query.eq('show_home', true)
  if (stories) query = query.eq('show_stories', true)
  if (category) {
    const id = isUuid(category) ? category : must(await db.from('categories').select('id').eq('slug', String(category)).maybeSingle())?.id
    query = id ? query.eq('category_id', id) : query.is('id', null) // categoria inexistente: nada
  }
  const s = term(q)
  if (s) query = query.or(`title.ilike.*${s}*,excerpt.ilike.*${s}*`)
  if (home || stories) query = query.order('featured', { ascending: false })
  const start = Math.max(0, +from || 0), n = Math.min(50, Math.max(1, +limit || 12))
  return must(await query.order('published_at', { ascending: false }).range(start, start + n - 1))
}

// A equipe logada também vê rascunhos: é a pré-visualização.
export async function getBySlug(slug, staff) {
  let q = db.from('posts').select('*, category:categories(name, slug)').eq('slug', String(slug))
  if (!staff) q = live(q)
  const p = must(await q.maybeSingle())
  if (!p) return null
  const { author_id, updated_by, legacy_id, ...pub } = p
  return pub
}

// ---------------------------------------------------------------- escrita (painel)
export const FIELDS = ['title', 'slug', 'excerpt', 'content', 'cover_url', 'cover_alt', 'status', 'published_at', 'category_id', 'tags',
  'show_home', 'show_stories', 'featured', 'seo_title', 'seo_description', 'author_name']
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const slugify = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

export function cleanPost(input) {
  const p = {}
  for (const k of FIELDS) if (k in input) p[k] = input[k]
  if ('slug' in p && !SLUG.test(p.slug || '')) fail(400, 'Endereço inválido: use só letras minúsculas, números e hífen.')
  if ('status' in p && !['draft', 'pending', 'published'].includes(p.status)) fail(400, 'Status inválido.')
  if ('tags' in p) p.tags = (Array.isArray(p.tags) ? p.tags : []).map(String).filter(Boolean).slice(0, 20)
  for (const k of ['show_home', 'show_stories', 'featured']) if (k in p) p[k] = !!p[k]
  if ('category_id' in p && p.category_id && !isUuid(p.category_id)) fail(400, 'Categoria inválida.')
  if ('published_at' in p) p.published_at = p.published_at ? new Date(p.published_at).toISOString() : null
  if (p.status === 'published' && !p.published_at) p.published_at = nowIso()
  return p
}

// Autor não publica e só mexe no que é dele e ainda não foi publicado.
export function canEditPost(user, post, next = {}) {
  if (canPublish(user)) return true
  return post.author_id === user.id && post.status !== 'published' && next.status !== 'published'
}

export async function updatePost(user, id, input) {
  if (!isUuid(id)) fail(404, 'Post não encontrado.')
  const old = must(await db.from('posts').select('*').eq('id', id).maybeSingle())
  if (!old) fail(404, 'Post não encontrado.')
  const p = cleanPost(input)
  if (!canEditPost(user, old, p)) fail(403, 'Você não tem permissão para essa ação. Peça a um editor.')
  // Guarda a versão anterior quando o texto muda (últimas 30 por post).
  if (['title', 'excerpt', 'content'].some(k => k in p && p[k] !== old[k])) {
    must(await db.from('post_revisions').insert({ post_id: id, title: old.title, excerpt: old.excerpt, content: old.content, saved_at: old.updated_at, saved_by: old.updated_by }))
    const extra = must(await db.from('post_revisions').select('id').eq('post_id', id).order('saved_at', { ascending: false }).range(30, 1000))
    if (extra.length) must(await db.from('post_revisions').delete().in('id', extra.map(r => r.id)))
  }
  return must(await db.from('posts').update({ ...p, updated_at: nowIso(), updated_by: user.id }).eq('id', id).select().single())
}

export async function createPost(user, input) {
  const p = cleanPost(input)
  if (!p.title?.trim()) fail(400, 'Dê um título ao post.')
  if (!p.slug) fail(400, 'Preencha o endereço do post.')
  if (!canPublish(user) && p.status === 'published') fail(403, 'Autores enviam para revisão; um editor publica.')
  return must(await db.from('posts').insert({ ...p, author_id: user.id, updated_by: user.id }).select().single())
}

// ---------------------------------------------------------------- números do painel
// O banco só guarda as visitas; as contas são feitas aqui. Dias no fuso de Brasília (UTC-3, sem horário de verão).
// ponytail: lê as visitas do período e soma no back-end; se passar de ~200 mil visitas por período, criar uma tabela de resumo diário.
const TZ_MS = 3 * 36e5
const dayOf = iso => new Date(new Date(iso).getTime() - TZ_MS).toISOString().slice(0, 10)

async function viewsSince(sinceIso) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const page = must(await db.from('post_views').select('post_id, visitor, referrer, device, created_at').gte('created_at', sinceIso).order('id').range(from, from + 999))
    out.push(...page)
    if (page.length < 1000) return out
  }
}

export async function stats(days) {
  const d = Math.min(365, Math.max(1, +days || 30))
  const today = dayOf(nowIso())
  const dayStart = offset => new Date(new Date(`${today}T00:00:00-03:00`).getTime() - offset * 864e5)
  const since = dayStart(d - 1), prev = dayStart(2 * d - 1)
  const all = await viewsSince(prev.toISOString())
  const cur = all.filter(v => new Date(v.created_at) >= since)

  const daily = Array.from({ length: d }, (_, i) => ({ day: dayOf(new Date(since.getTime() + i * 864e5 + TZ_MS).toISOString()), views: 0 }))
  const byDay = Object.fromEntries(daily.map(x => [x.day, x]))
  const posts = {}, refs = {}, devices = {}
  for (const v of cur) {
    if (byDay[dayOf(v.created_at)]) byDay[dayOf(v.created_at)].views++
    const p = posts[v.post_id] ??= { id: v.post_id, views: 0, set: new Set() }
    p.views++; p.set.add(v.visitor)
    const r = v.referrer || 'Acesso direto'; refs[r] = (refs[r] || 0) + 1
    devices[v.device] = (devices[v.device] || 0) + 1
  }
  return {
    views: cur.length,
    visitors: new Set(cur.map(v => v.visitor)).size,
    prev_views: all.length - cur.length,
    daily,
    posts: Object.values(posts).map(({ set, ...p }) => ({ ...p, visitors: set.size })).sort((a, b) => b.views - a.views),
    referrers: Object.entries(refs).map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views).slice(0, 8),
    devices,
  }
}
