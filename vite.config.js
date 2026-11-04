import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Front (Vite): o site e o painel em /admin/. Em desenvolvimento, /api vai para o back-end Next.js (server/, porta 3001).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001', '/sitemap.xml': { target: 'http://localhost:3001', rewrite: () => '/api/sitemap' } } },
  build: { rollupOptions: { input: { main: 'index.html', admin: 'admin/index.html' } } },
})
