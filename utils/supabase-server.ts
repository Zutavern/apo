import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerClient() {
  try {
    const cookieStore = cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Fehlende Supabase Umgebungsvariablen im Server-Kontext')
      throw new Error('Supabase Konfiguration unvollständig')
    }

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: { 'x-application-name': 'apo-server' }
        }
      }
    )

    // Test der Server-Verbindung
    const testServerConnection = async () => {
      try {
        const { data, error } = await client.from('users').select('count').single()
        if (error) {
          console.error('Server Supabase Verbindungsfehler:', error.message)
          return false
        }
        console.log('Server Supabase Verbindung erfolgreich')
        return true
      } catch (err) {
        console.error('Fehler beim Testen der Server Supabase-Verbindung:', err)
        return false
      }
    }

    // Führe den Verbindungstest aus
    testServerConnection()

    return client
  } catch (error) {
    console.error('Fehler beim Erstellen des Server Supabase Clients:', error)
    throw error
  }
} 