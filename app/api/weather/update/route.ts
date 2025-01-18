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
    console.log('Starte Wetteraktualisierung...')

    // 1. Wetterdaten von der API abrufen
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code,is_day,uv_index,pressure_msl,surface_pressure&daily=sunrise,sunset&timezone=Europe%2FBerlin`
    )

    if (!weatherResponse.ok) {
      throw new Error(`Wetter-API Fehler: ${weatherResponse.status}`)
    }

    const weatherData = await weatherResponse.json()
    console.log('Empfangene Wetterdaten:', weatherData)

    // 2. Location ID abrufen
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Hohenmölsen')
      .single()

    if (locationError) {
      throw new Error(`Fehler beim Abrufen der Location: ${locationError.message}`)
    }

    if (!locationData?.id) {
      throw new Error('Location ID nicht gefunden')
    }

    // 3. Wetterdaten aufbereiten und speichern
    const { error } = await supabase
      .from('current_weather')
      .upsert({
        location_id: locationData.id,
        temperature_2m: weatherData.current.temperature_2m,
        relative_humidity_2m: weatherData.current.relative_humidity_2m,
        apparent_temperature: weatherData.current.apparent_temperature,
        precipitation: weatherData.current.precipitation,
        wind_speed_10m: weatherData.current.wind_speed_10m,
        weather_code: weatherData.current.weather_code,
        is_day: weatherData.current.is_day === 1,
        uv_index: weatherData.current.uv_index,
        pressure_msl: weatherData.current.pressure_msl,
        surface_pressure: weatherData.current.surface_pressure,
        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'location_id'
      });

    if (error) {
      console.error('Fehler beim Speichern:', error)
      throw new Error(`Fehler beim Speichern: ${error.message}`)
    }

    console.log('Wetterdaten erfolgreich gespeichert')

    return NextResponse.json({
      success: true,
      message: 'Wetterdaten aktualisiert',
      data: {
        location_id: locationData.id,
        temperature_2m: weatherData.current.temperature_2m,
        relative_humidity_2m: weatherData.current.relative_humidity_2m,
        apparent_temperature: weatherData.current.apparent_temperature,
        precipitation: weatherData.current.precipitation,
        wind_speed_10m: weatherData.current.wind_speed_10m,
        weather_code: weatherData.current.weather_code,
        is_day: weatherData.current.is_day === 1,
        uv_index: weatherData.current.uv_index,
        pressure_msl: weatherData.current.pressure_msl,
        surface_pressure: weatherData.current.surface_pressure,
        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Fehler:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    }, { status: 500 })
  }
} 