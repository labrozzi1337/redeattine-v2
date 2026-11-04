import { db, must } from '@/lib/db'
import { live } from '@/lib/blog'

export const dynamic = 'force-dynamic'

// Mapa do site para o Google. O site publica em /sitemap.xml (rewrite na Vercel).
export async function GET() {
  const site = (process.env.SITE_URL || 'https://www.redeattini.com.br').replace(/\/$/, '')
  const posts = must(await live(db.from('posts').select('slug, updated_at')).order('published_at', { ascending: false }))
  const url = (loc, mod) => `<url><loc>${site}${loc}</loc>${mod ? `<lastmod>${String(mod).slice(0, 10)}</lastmod>` : ''}</url>`
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[url('/'), url('/blog'), ...posts.map(p => url(`/blog/${p.slug}`, p.updated_at))].join('')}</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
