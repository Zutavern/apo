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
    global: {
      headers: { 'x-application-name': 'apo' }
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
    
    // Test Storage Verbindung und erstelle Bucket falls notwendig
    try {
      // Prüfe ob Bucket existiert
      const { data: bucketData, error: getBucketError } = await supabase.storage
        .getBucket('avatars')
      
      if (getBucketError) {
        console.log('Bucket existiert noch nicht, wird erstellt...')
        
        // Erstelle Bucket
        const { data: newBucket, error: createError } = await supabase.storage
          .createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
            fileSizeLimit: 5242880 // 5MB
          })
        
        if (createError) {
          console.error('Fehler beim Erstellen des Buckets:', createError.message)
          return false
        }
        
        console.log('Bucket erfolgreich erstellt:', newBucket)
      } else {
        console.log('Bucket existiert bereits:', bucketData)
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