import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Client initialisieren
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Fehlende Umgebungsvariablen für Supabase')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

export async function GET(request: Request) {
  try {
    console.log('=== Start Wetteraktualisierung ===')

    // 1. Wetterdaten von der API abrufen
    console.log('1. Rufe Wetterdaten von API ab...')
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code,is_day,uv_index,pressure_msl,surface_pressure&daily=sunrise,sunset&timezone=Europe%2FBerlin`
    )

    if (!weatherResponse.ok) {
      console.error('API Fehler:', weatherResponse.status, await weatherResponse.text())
      throw new Error(`Wetter-API Fehler: ${weatherResponse.status}`)
    }

    const weatherData = await weatherResponse.json()
    console.log('Empfangene Wetterdaten:', JSON.stringify(weatherData.current, null, 2))

    // 2. Location ID abrufen
    console.log('2. Suche Location ID für Hohenmölsen...')
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Hohenmölsen')
      .single()

    if (locationError) {
      console.error('Location Fehler:', locationError)
      throw new Error(`Fehler beim Abrufen der Location: ${locationError.message}`)
    }

    if (!locationData?.id) {
      console.error('Keine Location ID gefunden')
      throw new Error('Location ID nicht gefunden')
    }

    console.log('Location ID gefunden:', locationData.id)

    // 3. Wetterdaten aufbereiten und speichern
    console.log('3. Bereite Wetterdaten für Speicherung vor...')
    const timestamp = new Date(weatherData.current.time)
    const weatherDataToSave = {
      location_id: locationData.id,
      timestamp: timestamp.toISOString(),
      temperature_2m: weatherData.current.temperature_2m,
      relative_humidity_2m: weatherData.current.relative_humidity_2m,
      apparent_temperature: weatherData.current.apparent_temperature,
      precipitation: weatherData.current.precipitation,
      wind_speed_10m: weatherData.current.wind_speed_10m,
      wind_direction_10m: weatherData.current.winddirection_10m,
      weathercode: weatherData.current.weather_code,
      is_day: weatherData.current.is_day === 1,
      uv_index: weatherData.current.uv_index,
      pressure_msl: weatherData.current.pressure_msl,
      surface_pressure: weatherData.current.surface_pressure,
      sunrise: weatherData.daily?.sunrise?.[0] ? new Date(weatherData.daily.sunrise[0]).toISOString() : null,
      sunset: weatherData.daily?.sunset?.[0] ? new Date(weatherData.daily.sunset[0]).toISOString() : null,
      is_expanded: false
    }
    
    console.log('Zu speichernde Daten:', JSON.stringify(weatherDataToSave, null, 2))

    try {
      const { error } = await supabase
        .from('current_weather_data')
        .upsert(weatherDataToSave, {
          onConflict: 'location_id'
        })

      if (error) {
        console.error('Speicherfehler:', error)
        console.error('Fehlerdetails:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Fehler beim Speichern: ${error.message}`)
      }

      console.log('✅ Wetterdaten erfolgreich gespeichert')
    } catch (error) {
      console.error('Fehler beim Speichern der Wetterdaten:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Wetterdaten aktualisiert',
      data: weatherDataToSave
    })

  } catch (error) {
    console.error('❌ Fehler bei der Wetteraktualisierung:', error)
    
    // Detailliertere Fehlermeldung
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unerwarteter Fehler ist aufgetreten'
    
    const errorResponse = {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }
    
    console.error('Fehler-Response:', JSON.stringify(errorResponse, null, 2))
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// POST-Route hinzufügen
export async function POST(request: Request) {
  return GET(request) // Wiederverwendung der GET-Logik
} 