import { randomUUID } from 'node:crypto'
import { route, fail } from '@/lib/http'
import { sql, t } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { upload, ensureBucket } from '@/lib/storage'
import { slugify } from '@/lib/blog'

const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' }

export const GET = route(async req => {
  await requireUser(req)
  return sql`select * from ${t('media')} order by created_at desc`
})

// Envio de imagem (o painel já reduz para webp de até 1920px antes de mandar).
export const POST = route(async req => {
  const u = await requireUser(req)
  const form = await req.formData().catch(() => fail(400, 'Envio inválido.'))
  const file = form.get('file')
  if (!file || typeof file === 'string') fail(400, 'Escolha uma imagem.')
  const ext = TYPES[file.type] || fail(400, 'Formato não aceito. Use JPG, PNG, WEBP ou GIF.')
  if (file.size > 10 * 1024 * 1024) fail(400, 'Imagem acima de 10 MB.')
  const d = new Date()
  const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${randomUUID().slice(0, 8)}-${slugify(String(form.get('name') || file.name).replace(/\.\w+$/, ''))}.${ext}`
  await ensureBucket()
  const url = await upload(path, Buffer.from(await file.arrayBuffer()), file.type)
  const [row] = await sql`insert into ${t('media')} (path, url, width, height, size, uploaded_by)
    values (${path}, ${url}, ${+form.get('width') || null}, ${+form.get('height') || null}, ${file.size}, ${u.id}) returning *`
  return row
})
