// Tudo que o site e o painel pedem ao back-end (Next.js) passa por aqui: /api no mesmo domínio.
// Em desenvolvimento, o Vite repassa /api para http://localhost:3001; na Vercel, um rewrite faz o mesmo.
export async function api(path, { method = 'GET', body, form } = {}) {
  const r = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  })
  const data = await r.json().catch(() => null)
  if (!r.ok && !data) throw Object.assign(new Error(import.meta.env.DEV
    ? 'O back-end não está respondendo. Ligue-o com "cd server && npm run dev".'
    : 'O servidor não respondeu. Tente de novo em instantes.'), { status: r.status })
  if (!r.ok) throw Object.assign(new Error(data?.error || `Erro ${r.status}`), { status: r.status })
  return data
}
