// Só API: o site (Vite) chama /api/... pelo próprio domínio (rewrite na Vercel e proxy no Vite em desenvolvimento).
// Monorepo: a raiz do back-end é esta pasta (sem isso o Next confunde com o package-lock.json da raiz).
const root = import.meta.dirname
export default { poweredByHeader: false, outputFileTracingRoot: root, turbopack: { root } }
