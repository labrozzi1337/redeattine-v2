import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as variáveis, o site segue funcionando com o conteúdo fixo de data.js.
export const sb = url && key ? createClient(url, key) : null
