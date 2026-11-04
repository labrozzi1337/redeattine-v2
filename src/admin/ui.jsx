import { useEffect, useState } from 'react'
import { api } from '../api'

// Chamada do painel ao back-end. Se a sessão expirar, o painel volta para o login.
export const call = (path, opts) => api(path, opts).catch(e => {
  if (e.status === 401 && !path.startsWith('/auth/')) dispatchEvent(new Event('adm-logout'))
  throw e
})

export const ROLES = { admin: 'Administrador', editor: 'Editor', author: 'Autor' }
export const ROLE_HINT = {
  admin: 'Tudo, inclusive convidar e remover pessoas.',
  editor: 'Publica, edita qualquer post, modera comentários.',
  author: 'Escreve os próprios posts e envia para revisão.',
}
export const STATUS = { published: ['Publicado', 'ok'], scheduled: ['Agendado', 'info'], pending: ['Em revisão', 'warn'], draft: ['Rascunho', 'mute'] }
export const statusOf = p => p.status === 'published' ? (new Date(p.published_at) > new Date() ? 'scheduled' : 'published') : p.status
export const Badge = ({ p }) => { const [l, c] = STATUS[statusOf(p)]; return <span className={`badge ${c}`}>{l}</span> }

export const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '')
// Texto puro do HTML, com espaço entre parágrafos, títulos e itens de lista.
export const plain = html => new DOMParser().parseFromString((html || '').replace(/<\/(p|h\d|li|blockquote|div)>|<br\s*\/?>/gi, ' $&'), 'text/html').body.textContent.replace(/\s+/g, ' ').trim()
export const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : '—'
export const fmtDateTime = d => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '') : '—'
export const fmtN = n => (n || 0).toLocaleString('pt-BR')

// Ícones (traço, 24x24). Strings fixas daqui mesmo, nunca conteúdo do usuário.
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
  italic: '<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  list: '<path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/>',
  ordered: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  minus: '<path d="M5 12h14"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
}
export const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[n] }} />
)

// Avisos rápidos no canto da tela
export const toast = (msg, bad) => dispatchEvent(new CustomEvent('adm-toast', { detail: { msg, bad, id: Math.random() } }))
export function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => {
    const h = e => { setList(l => [...l, e.detail]); setTimeout(() => setList(l => l.filter(x => x.id !== e.detail.id)), e.detail.bad ? 6000 : 3200) }
    addEventListener('adm-toast', h)
    return () => removeEventListener('adm-toast', h)
  }, [])
  return <div className="toasts" role="status" aria-live="polite">{list.map(t => <p key={t.id} className={t.bad ? 'bad' : ''}>{t.msg}</p>)}</div>
}

export const Switch = ({ on, onChange, label, hint, disabled, bare }) => (
  <label className={`sw ${disabled ? 'dis' : ''}`}>
    <input type="checkbox" checked={!!on} onChange={e => onChange(e.target.checked)} disabled={disabled} />
    <span className="sw-ui" aria-hidden="true" />
    <span className={bare ? 'sr' : 'sw-txt'}><b>{label}</b>{hint && <small>{hint}</small>}</span>
  </label>
)

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fechar"><Icon n="x" /></button></header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// Fotos grandes do celular viram webp de até 1920px antes de subir.
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file }
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85))
  return { blob, width: c.width, height: c.height }
}

export async function uploadImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} não é uma imagem.`)
  const { blob, width, height } = await shrink(file)
  const form = new FormData()
  form.append('file', blob, file.name)
  form.append('name', file.name)
  if (width) { form.append('width', width); form.append('height', height) }
  return call('/admin/media', { method: 'POST', form }) // o back-end grava no Storage e registra na biblioteca
}
