import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Duas entradas: o site (home + blog) e o painel em /admin/.
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', admin: 'admin/index.html' } } },
})
