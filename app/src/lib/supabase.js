import { createClient } from '@supabase/supabase-js'

// .trim() da suvišni razmak/novi red (npr. pri lijepljenju u Vercel) ne razbije zaglavlja.
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!url || !anonKey) {
  console.error('Nedostaju Supabase env varijable (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  throw new Error('Supabase nije konfiguriran — provjeri env varijable (lokalno .env, na Vercelu Project Settings → Environment Variables).')
}

export const supabase = createClient(url, anonKey)
