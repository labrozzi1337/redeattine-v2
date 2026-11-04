import { sql, t } from './db'
import { canPublish } from './auth'
import { fail } from './http'

// ---------------------------------------------------------------- leitura pública
const CARD = sql`p.id, p.slug, p.title, p.excerpt, p.cover_url, p.cover_alt, p.published_at, p.tags, p.featured, p.category_id,
  case when c.id is null then null else json_build_object('name', c.name, 'slug', c.slug) end as category`
const live = sql`p.status = 'published' and p.published_at <= now()`

export async function listPublished({ home, stories, category, q, from = 0, limit = 12 }) {
  const term = String(q || '').trim()
  const cat = category ? await sql`select id from ${t('categories')} where slug = ${category} or id::text = ${category}` : null
  return sql`select ${CARD} from ${t('posts')} p left join ${t('categories')} c on c.id = p.category_id
    where ${live}
      ${home ? sql`and p.show_home` : sql``}
      ${stories ? sql`and p.show_stories` : sql``}
      ${cat ? sql`and p.category_id = ${cat[0]?.id ?? null}` : sql``}
      ${term ? sql`and (p.title ilike ${'%' + term + '%'} or p.excerpt ilike ${'%' + term + '%'})` : sql``}
    order by ${home || stories ? sql`p.featured desc,` : sql``} p.published_at desc
    offset ${Math.max(0, +from || 0)} limit ${Math.min(50, Math.max(1, +limit || 12))}`
}

// A equipe logada também vê rascunhos: é a pré-visualização.
export async function getBySlug(slug, staff) {
  const [p] = await sql`select p.*, case when c.id is null then null else json_build_object('name', c.name, 'slug', c.slug) end as category
    from ${t('posts')} p left join ${t('categories')} c on c.id = p.category_id
    where p.slug = ${slug} ${staff ? sql`` : sql`and ${live}`}`
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
  if ('published_at' in p) p.published_at = p.published_at ? new Date(p.published_at) : null
  if (p.status === 'published' && !p.published_at) p.published_at = new Date()
  return p
}

// Mesmas regras de antes, agora no back-end: autor não publica e só mexe no que é dele e ainda não foi publicado.
export function canEditPost(user, post, next = {}) {
  if (canPublish(user)) return true
  return post.author_id === user.id && post.status !== 'published' && next.status !== 'published'
}

export async function updatePost(user, id, input) {
  const [old] = await sql`select * from ${t('posts')} where id = ${id}`
  if (!old) fail(404, 'Post não encontrado.')
  const p = cleanPost(input)
  if (!canEditPost(user, old, p)) fail(403, 'Você não tem permissão para essa ação. Peça a um editor.')
  return sql.begin(async tx => {
    // Guarda a versão anterior quando o texto muda (últimas 30 por post).
    if (['title', 'excerpt', 'content'].some(k => k in p && p[k] !== old[k])) {
      await tx`insert into ${t('post_revisions')} (post_id, title, excerpt, content, saved_at, saved_by)
        values (${id}, ${old.title}, ${old.excerpt}, ${old.content}, ${old.updated_at}, ${old.updated_by})`
      await tx`delete from ${t('post_revisions')} where post_id = ${id} and id not in
        (select id from ${t('post_revisions')} where post_id = ${id} order by saved_at desc limit 30)`
    }
    const [row] = await tx`update ${t('posts')} set ${tx({ ...p, updated_at: new Date(), updated_by: user.id })} where id = ${id} returning *`
    return row
  })
}

export async function createPost(user, input) {
  const p = cleanPost(input)
  if (!p.title?.trim()) fail(400, 'Dê um título ao post.')
  if (!p.slug) fail(400, 'Preencha o endereço do post.')
  if (!canPublish(user) && p.status === 'published') fail(403, 'Autores enviam para revisão; um editor publica.')
  const [row] = await sql`insert into ${t('posts')} ${sql({ ...p, author_id: user.id, updated_by: user.id })} returning *`
  return row
}

// ---------------------------------------------------------------- números do painel (dias no fuso de Brasília)
export async function stats(days) {
  const d = Math.min(365, Math.max(1, +days || 30))
  const TZ = 'America/Sao_Paulo'
  const [{ since, prev }] = await sql`select (date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}) - make_interval(days => ${d - 1}) as since,
    (date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}) - make_interval(days => ${2 * d - 1}) as prev`
  const V = t('post_views')
  const [[tot], [old], daily, posts, referrers, devices] = await Promise.all([
    sql`select count(*)::int as views, count(distinct visitor)::int as visitors from ${V} where created_at >= ${since}`,
    sql`select count(*)::int as n from ${V} where created_at >= ${prev} and created_at < ${since}`,
    sql`select to_char(g.day, 'YYYY-MM-DD') as day, coalesce(v.n, 0)::int as views
        from generate_series((${since}::timestamptz at time zone ${TZ})::date, (now() at time zone ${TZ})::date, interval '1 day') as g(day)
        left join (select (created_at at time zone ${TZ})::date as day, count(*) as n from ${V} where created_at >= ${since} group by 1) v on v.day = g.day::date
        order by g.day`,
    sql`select post_id as id, count(*)::int as views, count(distinct visitor)::int as visitors from ${V} where created_at >= ${since} group by 1 order by 2 desc`,
    sql`select coalesce(referrer, 'Acesso direto') as name, count(*)::int as views from ${V} where created_at >= ${since} group by 1 order by 2 desc limit 8`,
    sql`select device, count(*)::int as n from ${V} where created_at >= ${since} group by 1`,
  ])
  return { ...tot, prev_views: old.n, daily, posts, referrers, devices: Object.fromEntries(devices.map(x => [x.device, x.n])) }
}
