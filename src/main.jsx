import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './v2.css'

// /blog, /blog/slug e os endereços antigos do WordPress (/2026/09/slug/) abrem o blog; o resto é a home.
// O painel tem entrada própria em /admin/.
const isBlog = /^\/(blog(\/|$)|\d{4}\/\d{2}\/[^/]+)/.test(location.pathname)
const Page = isBlog ? lazy(() => import('./blog/BlogPages')) : lazy(() => import('./App'))
if (!isBlog) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(<Suspense fallback={null}><Page /></Suspense>)
