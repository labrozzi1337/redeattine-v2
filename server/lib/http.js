import { NextResponse } from 'next/server'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const fail = (status, message) => { throw new HttpError(status, message) }

// Origens que podem fazer alterações (proteção contra envio de formulário de outro site).
const allowed = () => [process.env.SITE_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', ...(process.env.ALLOWED_ORIGINS || '').split(',')]
  .filter(Boolean).map(u => new URL(u.trim()).origin)

// Envolve cada rota: confere a origem, trata erros e devolve JSON.
export const route = fn => async (req, ctx) => {
  try {
    const origin = req.headers.get('origin')
    if (!['GET', 'HEAD'].includes(req.method) && origin && !allowed().includes(origin)) fail(403, 'Origem não permitida.')
    const params = ctx?.params ? await ctx.params : {}
    const out = await fn(req, params)
    return out instanceof Response ? out : NextResponse.json(out ?? { ok: true })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    if (e?.code === '22P02') return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 }) // id malformado
    if (e?.code === '23505') return NextResponse.json({ error: 'Já existe um registro com esse valor.' }, { status: 409 })
    console.error(e)
    return NextResponse.json({ error: 'Erro no servidor. Tente de novo.' }, { status: 500 })
  }
}

export async function body(req) {
  try { return await req.json() } catch { fail(400, 'Dados inválidos.') }
}

export const query = req => Object.fromEntries(new URL(req.url).searchParams)
