// Traz posts, imagens e comentários do WordPress da Attini para o Supabase.
//
//   node scripts/migrate-wordpress.mjs --dry           só mostra o que seria importado
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-wordpress.mjs
//
// Pode rodar de novo quando quiser: importa só o que é novo no WordPress e não mexe em post
// já importado (edições feitas no painel ficam). Use --atualizar para sobrescrever com o WordPress.
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const WP = 'https://www.redeattini.com.br/wp-json/wp/v2'
const DRY = process.argv.includes('--dry')
const OVERWRITE = process.argv.includes('--atualizar')

// Categorias novas (o WordPress só tinha "Sem categoria"). A primeira regra que bater vale.
const CATEGORIES = [
  ['Eventos', 'eventos', /feicon|expo ?revestir|expoconstruir|feira|conex[aã]o/i],
  ['Rede Attini', 'rede-attini', /attini|vampeta|festival/i],
  ['Gestão da loja', 'gestao-da-loja', /fideliz|sucess[aã]o|parceria|benef[ií]cios|compra coletiva|negocia[cç][aã]o|tecnologia|lucrar/i],
  ['Mercado', 'mercado', /./],
]
// Posts que já viraram "Histórias da rede" na home (etiqueta e texto curto do card).
const STORIES = {
  1136: ['Conexão Attini', 'Na 1ª edição, 60 lojas associadas e mais de 200 participantes negociaram frente a frente com as indústrias: R$ 12 milhões em um único dia.'],
  1417: ['Lojistas na mídia', 'Flávio Nóbrega (Casa Seridó, PB), Dante Aligieri e Henrique Lima (Casa Center, PB) e Renata Rezende (Construtora Rezende, GO) mostraram como tecnologia e atendimento fecham a venda no pequeno varejo.'],
  1096: ['Festival de Prêmios', 'Com Atlas e Luztol, cada compra a partir de R$ 200 em uma loja da rede virou um bilhete da sorte para o consumidor final.'],
  1141: ['Expansão', 'A reunião com lojistas mineiros abriu o caminho da Attini no Sudeste.'],
  793: ['Embaixador', 'O pentacampeão do mundo pela Seleção é o embaixador da rede.'],
}

const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&hellip;/g, '…').replace(/&amp;/g, '&')
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\[…\]/g, '').replace(/\s+/g, ' ').trim()

async function all(path) {
  const out = []
  for (let page = 1; ; page++) {
    const r = await fetch(`${WP}/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!r.ok) break
    const list = await r.json()
    out.push(...list)
    if (page >= +r.headers.get('x-wp-totalpages')) break
  }
  return out
}

// Limpa o HTML do WordPress: tira atributos de layout e as quebras de linha coladas no meio das frases.
function cleanContent(html) {
  return html
    .replace(/\s(class|srcset|sizes|style|decoding|loading|fetchpriority)="[^"]*"/g, '')
    .replace(/<p>\s*(<br\s*\/?>\s*)+/g, '<p>')
    .replace(/<br\s*\/?>\s*(?=[a-zà-ú(])/g, ' ')
    .replace(/https?:\/\/([\w-]+\.)?redeattini\.com\.br\/\d{4}\/\d{2}\/([^/"]+)\/?/g, '/blog/$2')
    // vídeo do YouTube no formato que o editor do painel reconhece
    .replace(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*><\/iframe>/g, '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/$1" allowfullscreen="true"></iframe></div>')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

const wpPosts = await all('posts?_embed=wp:featuredmedia')
const wpComments = await all('comments')
const imgRe = /https?:\/\/(?:[\w-]+\.)?redeattini\.com\.br\/wp-content\/uploads\/[^"'\s)]+\.(?:jpe?g|png|webp|gif)/gi

const plan = wpPosts.map(p => {
  const title = text(p.title.rendered)
  const media = p._embedded?.['wp:featuredmedia']?.[0]
  const sizes = media?.media_details?.sizes || {}
  const cover = (sizes['1536x1536'] || sizes.full || sizes.large)?.source_url || media?.source_url || null
  const content = cleanContent(p.content.rendered)
  const [cat, catSlug] = CATEGORIES.find(([, , re]) => re.test(title))
  const story = STORIES[p.id]
  const yoast = p.yoast_head_json || {}
  return {
    legacy_id: p.id, legacy_url: p.link, slug: p.slug, title,
    excerpt: story?.[1] || text(p.excerpt.rendered).slice(0, 300),
    content, cover, cover_alt: media?.alt_text || '',
    status: 'published', published_at: p.date_gmt + 'Z', author_name: 'Rede Attini',
    category: catSlug, catName: cat, tags: story ? [story[0]] : [],
    show_home: true, show_stories: !!story, featured: false,
    seo_title: (yoast.title || '').replace(/\s[-|]\s*Rede Attini$/, '') === title ? '' : (yoast.title || '').replace(/\s[-|]\s*Rede Attini$/, ''),
    seo_description: yoast.description || yoast.og_description || '',
    images: [...new Set(content.match(imgRe) || [])],
  }
})

if (DRY) {
  const byCat = plan.reduce((a, p) => ({ ...a, [p.catName]: (a[p.catName] || 0) + 1 }), {})
  console.log(`${plan.length} posts · ${plan.filter(p => p.cover).length} capas · ${plan.reduce((n, p) => n + p.images.length, 0)} imagens no texto · ${wpComments.length} comentários`)
  console.log('Categorias:', byCat)
  console.log('Histórias da rede:', plan.filter(p => p.show_stories).map(p => `${p.tags[0]} → ${p.slug}`))
  const sample = plan.find(p => p.legacy_id === 1424)
  console.log('\nExemplo de conteúdo limpo:\n', sample?.content.slice(0, 500))
  process.exit(0)
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou use --dry).'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data }

// Imagens: baixa do WordPress, converte para webp (até 1600px) e guarda no Storage. Reaproveita o que já subiu.
const known = new Map(must(await sb.from('media').select('path, url')).map(m => [m.path, m.url]))
async function copyImage(src, alt = '') {
  const name = decodeURIComponent(src.split('/').pop()).replace(/\.\w+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const path = `wp/${src.match(/uploads\/(\d{4})\//)?.[1] || 'antigas'}/${name}.webp`
  if (known.has(path)) return known.get(path)
  const r = await fetch(src)
  if (!r.ok) { console.warn('  imagem não baixou:', src); return src }
  const { data: buf, info } = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
  must(await sb.storage.from('media').upload(path, buf, { contentType: 'image/webp', cacheControl: '31536000', upsert: true }))
  const url = sb.storage.from('media').getPublicUrl(path).data.publicUrl
  must(await sb.from('media').upsert({ path, url, alt, width: info.width, height: info.height, size: buf.length }, { onConflict: 'path' }))
  known.set(path, url)
  return url
}

const cats = {}
for (const [name, slug] of CATEGORIES) cats[slug] = must(await sb.from('categories').upsert({ name, slug }, { onConflict: 'slug' }).select('id').single()).id

const existing = new Map(must(await sb.from('posts').select('id, legacy_id').not('legacy_id', 'is', null)).map(p => [p.legacy_id, p.id]))
const ids = new Map(existing)
let added = 0, updated = 0
for (const p of plan.sort((a, b) => a.published_at.localeCompare(b.published_at))) {
  if (existing.has(p.legacy_id) && !OVERWRITE) continue
  process.stdout.write(`${existing.has(p.legacy_id) ? 'atualizando' : 'importando'}: ${p.title.slice(0, 70)}\n`)
  let content = p.content
  for (const src of p.images) content = content.split(src).join(await copyImage(src))
  const { images, category, catName, cover, ...row } = p
  Object.assign(row, { content, category_id: cats[category], cover_url: cover ? await copyImage(cover, p.cover_alt) : null })
  const saved = must(await sb.from('posts').upsert(row, { onConflict: 'legacy_id' }).select('id').single())
  ids.set(p.legacy_id, saved.id)
  existing.has(p.legacy_id) ? updated++ : added++
}

// Comentários: pais antes dos filhos, para ligar as respostas.
const commentIds = new Map(must(await sb.from('comments').select('id, legacy_id').not('legacy_id', 'is', null)).map(c => [c.legacy_id, c.id]))
let comments = 0
for (const c of wpComments.sort((a, b) => a.parent - b.parent || a.id - b.id)) {
  if (commentIds.has(c.id) || !ids.has(c.post)) continue
  const row = must(await sb.from('comments').insert({
    legacy_id: c.id, post_id: ids.get(c.post), parent_id: c.parent ? commentIds.get(c.parent) ?? null : null,
    author_name: decode(c.author_name).slice(0, 80), content: text(c.content.rendered), status: 'approved', created_at: c.date_gmt + 'Z',
  }).select('id').single())
  commentIds.set(c.id, row.id); comments++
}

console.log(`\nPronto: ${added} posts novos, ${updated} atualizados, ${comments} comentários, ${known.size} imagens na biblioteca.`)
