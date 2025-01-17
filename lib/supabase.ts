import { createClient } from '@supabase/supabase-js'

// Verbesserte Fehlerprüfung für Umgebungsvariablen
const checkEnvironmentVariables = () => {
  const missingVars = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  // Service Role Key nur auf Server-Seite prüfen
  if (typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY fehlt oder ist nicht definiert')
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
  }
  
  if (missingVars.length > 0) {
    console.error('Fehlende Umgebungsvariablen:', missingVars)
    throw new Error(`Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`)
  }
}

// Prüfe Umgebungsvariablen
checkEnvironmentVariables()

// Erstelle Supabase Client mit öffentlicher Konfiguration
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
)

// Erstelle Admin-Client nur auf Server-Seite
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
  : null

// Hilfsfunktion für Storage-URLs
export const getStorageUrl = (bucket: string, path: string): string => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ist nicht definiert')
  }
  
  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  console.log('Generated Storage URL:', storageUrl)
  return storageUrl
}

export type User = {
  id: string
  username: string
  created_at: string
} 