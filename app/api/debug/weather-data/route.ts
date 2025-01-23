import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Supabase Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Aktuelle Wetterdaten abrufen
    const { data: currentWeather, error: currentError } = await supabase
      .from('current_weather')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (currentError) {
      console.error('Fehler beim Abrufen der aktuellen Wetterdaten:', currentError)
    }

    // Vorhersagedaten abrufen
    const { data: forecast, error: forecastError } = await supabase
      .from('forecast')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (forecastError) {
      console.error('Fehler beim Abrufen der Vorhersagedaten:', forecastError)
    }

    // Pollendaten abrufen
    const { data: pollen, error: pollenError } = await supabase
      .from('pollen')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pollenError) {
      console.error('Fehler beim Abrufen der Pollendaten:', pollenError)
    }

    // Alle Daten zusammenfassen
    const debugData = {
      currentWeather: {
        data: currentWeather,
        error: currentError?.message,
        timestamp: currentWeather?.created_at
      },
      forecast: {
        data: forecast,
        error: forecastError?.message,
        timestamp: forecast?.created_at
      },
      pollen: {
        data: pollen,
        error: pollenError?.message,
        timestamp: pollen?.created_at
      }
    }

    return NextResponse.json(debugData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Fehler im Debug-Endpunkt:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Abrufen der Debug-Daten' },
      { status: 500 }
    )
  }
} 