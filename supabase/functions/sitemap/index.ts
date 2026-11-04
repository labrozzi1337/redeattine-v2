// Mapa do site para o Google (substitui o sitemap do Yoast). Público, sem login.
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async () => {
  const site = (Deno.env.get('SITE_URL') ?? 'https://www.redeattini.com.br').replace(/\/$/, '')
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data } = await sb.from('posts').select('slug, updated_at')
    .eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false })
  const url = (loc: string, mod?: string) => `<url><loc>${site}${loc}</loc>${mod ? `<lastmod>${mod.slice(0, 10)}</lastmod>` : ''}</url>`
  const body = [url('/'), url('/blog'), ...(data ?? []).map(p => url(`/blog/${p.slug}`, p.updated_at))].join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
})
