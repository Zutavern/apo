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
  
  if (missingVars.length > 0) {
    console.error('Fehlende Umgebungsvariablen:', missingVars)
    throw new Error(`Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`)
  }
}

// Prüfe Umgebungsvariablen
checkEnvironmentVariables()

// Erstelle Supabase Client mit verbesserter Konfiguration
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 'x-application-name': 'apo' }
    }
  }
)

// Teste die Verbindung
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single()
    if (error) {
      console.error('Supabase Verbindungsfehler:', error.message)
      return false
    }
    console.log('Supabase Verbindung erfolgreich')
    return true
  } catch (err) {
    console.error('Fehler beim Testen der Supabase-Verbindung:', err)
    return false
  }
}

// Führe den Verbindungstest aus
testConnection()

export type User = {
  id: string
  username: string
  created_at: string
} 