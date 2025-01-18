import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Erforderliche Umgebungsvariablen fehlen')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET() {
  try {
    // Hole Location ID für Hohenmölsen
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Hohenmölsen')
      .single()

    if (locationError || !locationData) {
      return NextResponse.json({
        success: false,
        error: 'Location nicht gefunden'
      })
    }

    // Hole 7-Tage-Vorhersage von der API
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?' +
      'latitude=51.1712&longitude=12.1276' +
      '&timezone=Europe/Berlin' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset,uv_index_max,pressure_msl_mean' +
      '&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day'
    )

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der API-Daten')
    }

    const weatherData = await response.json()

    // Bereite die Daten für die nächsten 7 Tage vor
    const forecastData = weatherData.daily.time.map((date: string, index: number) => ({
      location_id: locationData.id,
      forecast_day: index + 1,
      date: date,
      temperature_2m_max: weatherData.daily.temperature_2m_max[index],
      temperature_2m_min: weatherData.daily.temperature_2m_min[index],
      precipitation_sum: weatherData.daily.precipitation_sum[index],
      weather_code: weatherData.daily.weather_code[index],
      sunrise: weatherData.daily.sunrise[index],
      sunset: weatherData.daily.sunset[index],
      uv_index_max: weatherData.daily.uv_index_max[index],
      pressure_msl_mean: weatherData.daily.pressure_msl_mean[index],
      
      // Hole die 24 Stunden für diesen Tag
      temperature_2m: weatherData.hourly.temperature_2m.slice(index * 24, (index + 1) * 24),
      relative_humidity_2m: weatherData.hourly.relative_humidity_2m.slice(index * 24, (index + 1) * 24),
      apparent_temperature: weatherData.hourly.apparent_temperature.slice(index * 24, (index + 1) * 24),
      precipitation_probability: weatherData.hourly.precipitation_probability.slice(index * 24, (index + 1) * 24),
      precipitation: weatherData.hourly.precipitation.slice(index * 24, (index + 1) * 24),
      weather_code_hourly: weatherData.hourly.weather_code.slice(index * 24, (index + 1) * 24),
      wind_speed_10m: weatherData.hourly.wind_speed_10m.slice(index * 24, (index + 1) * 24),
      wind_direction_10m: weatherData.hourly.wind_direction_10m.slice(index * 24, (index + 1) * 24),
      is_day: weatherData.hourly.is_day.slice(index * 24, (index + 1) * 24)
    }))

    // Lösche alte Vorhersagen für diesen Standort
    const { error: deleteError } = await supabase
      .from('forecast')
      .delete()
      .eq('location_id', locationData.id)

    if (deleteError) {
      throw new Error('Fehler beim Löschen alter Vorhersagen')
    }

    // Speichere neue Vorhersagen
    const { error: insertError } = await supabase
      .from('forecast')
      .insert(forecastData)

    if (insertError) {
      throw new Error('Fehler beim Speichern der Vorhersagen')
    }

    return NextResponse.json({
      success: true,
      message: 'Vorhersagedaten aktualisiert',
      data: forecastData
    })

  } catch (error) {
    console.error('Fehler in der Forecast Update Route:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren der Vorhersage'
    })
  }
} 