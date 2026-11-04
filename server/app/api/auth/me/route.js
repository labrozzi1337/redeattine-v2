import { route } from '@/lib/http'
import { currentUser, publicUser } from '@/lib/auth'
import { mailOn } from '@/lib/mail'

// Quem está logado (ou null). Também diz ao painel se há envio de e-mail configurado.
export const GET = route(async req => {
  const u = await currentUser(req)
  return { user: u && publicUser(u), mail: mailOn() }
})
