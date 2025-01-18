import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Lade Umgebungsvariablen
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL oder Key fehlt in den Umgebungsvariablen')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkForecastData() {
  try {
    const response = await fetch('http://localhost:3000/api/weather/forecast/current')
    const data = await response.json()
    console.log('Forecast-Daten:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Fehler:', error)
  }
}

checkForecastData() 