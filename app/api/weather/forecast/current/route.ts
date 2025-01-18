import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Erforderliche Umgebungsvariablen fehlen')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Hole die Vorhersagedaten für die nächsten 7 Tage
    const { data: forecastData, error } = await supabase
      .from('forecast')
      .select('*')
      .order('forecast_day', { ascending: true })
      .limit(7)

    if (error) {
      console.error('Fehler beim Abrufen der Vorhersagedaten:', error)
      return NextResponse.json(
        { success: false, error: 'Fehler beim Laden der Vorhersagedaten' },
        { status: 500 }
      )
    }

    if (!forecastData || forecastData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine Vorhersagedaten gefunden' },
        { status: 404 }
      )
    }

    console.log('Rohe Forecast-Daten:', forecastData)

    // Formatiere die Daten im erwarteten Format
    const formattedData = {
      success: true,
      data: {
        daily: {
          time: forecastData.map(day => day.date),
          temperature_2m_max: forecastData.map(day => day.temperature_2m_max),
          temperature_2m_min: forecastData.map(day => day.temperature_2m_min),
          precipitation_sum: forecastData.map(day => day.precipitation_sum),
          weather_code: forecastData.map(day => day.weather_code),
          sunrise: forecastData.map(day => day.sunrise),
          sunset: forecastData.map(day => day.sunset),
          uv_index_max: forecastData.map(day => day.uv_index_max),
          pressure_msl_mean: forecastData.map(day => day.pressure_msl_mean)
        }
      }
    }

    console.log('Formatierte Forecast-Daten:', JSON.stringify(formattedData, null, 2))

    return NextResponse.json(formattedData)

  } catch (err) {
    console.error('Server Error:', err)
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten' 
      },
      { status: 500 }
    )
  }
} 