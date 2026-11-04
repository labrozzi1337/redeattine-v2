import { NextResponse } from 'next/server'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const fail = (status, message) => { throw new HttpError(status, message) }

// Origens que podem fazer alterações (proteção contra envio de formulário de outro site).
const allowed = () => [process.env.SITE_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', ...(process.env.ALLOWED_ORIGINS || '').split(',')]
  .filter(Boolean).map(u => new URL(u.trim()).origin)

// Erros do banco/API do Supabase traduzidos para o que dá para resolver.
const SETUP = {
  PGRST106: 'O schema SYS_SITE_ATTINI não está exposto: Supabase > Project Settings > Data API > Exposed schemas > adicione SYS_SITE_ATTINI.',
  PGRST205: 'Tabelas do blog não encontradas: rode as migrations server/db/001, 002 e 003 no SQL Editor do Supabase.',
  '42P01': 'Tabelas do blog não encontradas: rode as migrations server/db/001, 002 e 003 no SQL Editor do Supabase.',
  '42501': 'O back-end não tem permissão no schema SYS_SITE_ATTINI: rode a migration server/db/003_acesso_api.sql no SQL Editor.',
  PGRST301: 'Chave do Supabase inválida: confira SUPABASE_SECRET_KEY.',
}

// Envolve cada rota: confere a origem, trata erros e devolve JSON.
export const route = fn => async (req, ctx) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) fail(503, 'Back-end sem SUPABASE_URL/SUPABASE_SECRET_KEY em server/.env.local (na Vercel, nas variáveis do projeto).')
    const origin = req.headers.get('origin')
    if (!['GET', 'HEAD'].includes(req.method) && origin && !allowed().includes(origin)) fail(403, 'Origem não permitida.')
    const params = ctx?.params ? await ctx.params : {}
    const out = await fn(req, params)
    return out instanceof Response ? out : NextResponse.json(out ?? { ok: true })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    if (SETUP[e?.code]) { console.error(e); return NextResponse.json({ error: SETUP[e.code] }, { status: 503 }) }
    if (e?.code === '22P02' || e?.code === 'PGRST116') return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
    if (e?.code === '23505') return NextResponse.json({ error: 'Já existe um registro com esse valor.' }, { status: 409 })
    if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(e?.message || '')) { console.error(e); return NextResponse.json({ error: 'Não foi possível falar com o Supabase. Confira SUPABASE_URL e a internet.' }, { status: 503 }) }
    console.error(e)
    return NextResponse.json({ error: 'Erro no servidor. Tente de novo.' }, { status: 500 })
  }
}

export async function body(req) {
  try { return await req.json() } catch { fail(400, 'Dados inválidos.') }
}

export const query = req => Object.fromEntries(new URL(req.url).searchParams)
