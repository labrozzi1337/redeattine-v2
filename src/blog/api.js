import { sb } from '../supabase'

const CARD = 'id, slug, title, excerpt, cover_url, cover_alt, published_at, tags, featured, category_id, category:categories(name, slug)'
export const postHref = p => `/blog/${p.slug}`

// Só o que está publicado e já chegou na data (vale também para quem está logado no painel).
const published = () => sb.from('posts').select(CARD).eq('status', 'published').lte('published_at', new Date().toISOString())

export async function listPosts({ home, stories, category, q, from = 0, limit = 12 } = {}) {
  if (!sb) return []
  let query = published()
  if (home) query = query.eq('show_home', true).order('featured', { ascending: false })
  if (stories) query = query.eq('show_stories', true).order('featured', { ascending: false })
  if (category) query = query.eq('category_id', category)
  const term = q?.replace(/[%,()]/g, ' ').trim()
  if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`)
  const { data } = await query.order('published_at', { ascending: false }).range(from, from + limit - 1)
  return data || []
}

export async function listCategories() {
  if (!sb) return []
  const { data } = await sb.from('categories').select('id, name, slug').order('name')
  return data || []
}

// A equipe logada também enxerga rascunhos aqui: é a pré-visualização.
export async function getPost(slug) {
  if (!sb) return null
  const { data } = await sb.from('posts').select('*, category:categories(name, slug)').eq('slug', slug).maybeSingle()
  return data
}

export async function listComments(postId) {
  const { data } = await sb.from('comments').select('id, parent_id, author_name, content, user_id, created_at')
    .eq('post_id', postId).eq('status', 'approved').order('created_at')
  return data || []
}

export const addComment = (postId, parentId, name, email, content) =>
  sb.rpc('add_comment', { p_post: postId, p_parent: parentId, p_name: name, p_email: email, p_content: content })

export async function trackView(post) {
  const { data: { session } } = await sb.auth.getSession()
  if (session) return // visitas da equipe não contam
  let visitor
  try { visitor = localStorage.getItem('attini-vid') || crypto.randomUUID(); localStorage.setItem('attini-vid', visitor) } catch { visitor = crypto.randomUUID() }
  let referrer = ''
  try { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h !== location.hostname.replace(/^www\./, '')) referrer = h } catch {}
  await sb.rpc('track_view', { p_post: post.id, p_visitor: visitor, p_referrer: referrer, p_device: matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop' })
}
