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
    },
    storage: {
      storageBackend: 'storage-api'
    }
  }
)

// Teste die Verbindung und Storage
const testConnection = async () => {
  try {
    // Test DB Verbindung
    const { data, error } = await supabase.from('users').select('count').single()
    if (error) {
      console.error('Supabase Verbindungsfehler:', error.message)
      return false
    }
    
    // Test Storage Verbindung
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .getBucket('avatars')
      
      if (storageError) {
        console.error('Storage Fehler:', storageError.message)
        return false
      }
      
      console.log('Storage Verbindung erfolgreich')
    } catch (storageErr) {
      console.error('Fehler beim Zugriff auf Storage:', storageErr)
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

// Hilfsfunktion für Storage-URLs
export const getStorageUrl = (bucket: string, path: string): string => {
  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  console.log('Generated Storage URL:', storageUrl)
  return storageUrl
}

export type User = {
  id: string
  username: string
  created_at: string
} 