import { api } from '../api'

export const postHref = p => `/blog/${p.slug}`

// Posts publicados (o back-end já filtra rascunhos e agendados).
export function listPosts({ home, stories, category, q, from = 0, limit = 12 } = {}) {
  const p = new URLSearchParams({ from, limit })
  if (home) p.set('home', '1')
  if (stories) p.set('stories', '1')
  if (category) p.set('category', category)
  if (q) p.set('q', q)
  return api('/posts?' + p).catch(() => [])
}

export const listCategories = () => api('/categories').catch(() => [])

// A equipe logada também enxerga rascunhos aqui: é a pré-visualização.
export const getPost = slug => api('/posts/' + encodeURIComponent(slug)).catch(e => (e.status === 404 ? null : Promise.reject(e)))

export const listComments = slug => api(`/posts/${encodeURIComponent(slug)}/comments`).catch(() => [])

export const addComment = (slug, parentId, name, email, content, site) =>
  api(`/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: { parent_id: parentId, name, email, content, site } })

export function trackView(post) {
  let visitor
  try { visitor = localStorage.getItem('attini-vid') || crypto.randomUUID(); localStorage.setItem('attini-vid', visitor) } catch { visitor = crypto.randomUUID() }
  let referrer = ''
  try { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h !== location.hostname.replace(/^www\./, '')) referrer = h } catch {}
  return api(`/posts/${encodeURIComponent(post.slug)}/view`, {
    method: 'POST', body: { visitor, referrer, device: matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop' },
  }).catch(() => {})
}
