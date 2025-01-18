import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Lade Umgebungsvariablen
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Fehlende Umgebungsvariablen')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('Prüfe Datenbankverbindung...')
  
  try {
    // Prüfe forecast Tabelle
    const { data: forecastData, error: forecastError } = await supabase
      .from('forecast')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1)

    if (forecastError) {
      console.error('Fehler beim Abrufen der Vorhersagedaten:', forecastError)
      return
    }

    console.log('Neueste Vorhersagedaten:', JSON.stringify(forecastData, null, 2))
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
  }
}

checkDatabase() 