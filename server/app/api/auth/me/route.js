import { route } from '@/lib/http'
import { currentUser } from '@/lib/auth'
import { mailOn } from '@/lib/mail'

// Quem está logado (ou null). Também diz ao painel se há envio de e-mail configurado.
export const GET = route(async req => {
  const u = await currentUser(req)
  return { user: u && { id: u.id, email: u.email, name: u.name, role: u.role }, mail: mailOn() }
})
