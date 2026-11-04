import { createClient } from '@supabase/supabase-js'

// Arquivos (imagens do blog) no Supabase Storage, num bucket só deste site. Só o back-end tem a chave.
export const BUCKET = 'site-attini'
let client
const storage = () => (client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })).storage

export async function ensureBucket() {
  const { data } = await storage().getBucket(BUCKET)
  if (!data) {
    const { error } = await storage().createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 })
    if (error && !/exists/i.test(error.message)) throw error
  }
}

export const publicUrl = path => storage().from(BUCKET).getPublicUrl(path).data.publicUrl

export async function upload(path, data, contentType, upsert = false) {
  const { error } = await storage().from(BUCKET).upload(path, data, { contentType, cacheControl: '31536000', upsert })
  if (error) throw error
  return publicUrl(path)
}

export async function remove(path) {
  const { error } = await storage().from(BUCKET).remove([path])
  if (error) throw error
}
