import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Front (Vite): o site e o painel em /admin/. Em desenvolvimento, /api vai para o back-end Next.js (server/, porta 3001).
const API = process.env.API_URL || 'http://localhost:3001' // back-end em desenvolvimento

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': API, '/sitemap.xml': { target: API, rewrite: () => '/api/sitemap' } } },
  build: { rollupOptions: { input: { main: 'index.html', admin: 'admin/index.html' } } },
})
