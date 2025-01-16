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

// Simulierte Fehler für Tests
const simulateError = async (testCase: string | null) => {
  if (!testCase) {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&timezone=Europe/Berlin`
    )
    return response
  }

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 6000))
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden')
    
    case 'invalid':
      return new Response(JSON.stringify({
        daily: {
          time: ['2025-01-16'],
          // Fehlende erforderliche Felder
          temperature_2m_max: null,
          temperature_2m_min: undefined,
          precipitation_sum: [],
        }
      }))
    
    case 'database':
      return new Response(JSON.stringify({
        daily: {
          time: ['2025-01-16'],
          temperature_2m_max: [999999999],
          temperature_2m_min: [-999999999],
          precipitation_sum: [0],
          precipitation_probability_max: [0],
          weather_code: [0],
          wind_speed_10m_max: [4.5],
          wind_gusts_10m_max: [6.8],
          wind_direction_10m_dominant: [180],
          sunrise: ['2025-01-16T08:07'],
          sunset: ['2025-01-16T16:35'],
          uv_index_max: [1.2]
        }
      }))
    
    default:
      return fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&timezone=Europe/Berlin`
      )
  }
}

// Validierungsfunktionen
const isValidDailyData = (data: any) => {
  const requiredFields = [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'sunrise',
    'sunset'
  ]
  
  return requiredFields.every(field => {
    const value = data[field]
    return value !== undefined && value !== null && !isNaN(value)
  })
}

const validateForecastResponse = (data: any) => {
  if (!data || !data.daily || !Array.isArray(data.daily.time)) {
    throw new Error('Ungültiges Antwortformat von Open-Meteo')
  }
  
  const requiredArrays = [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'wind_direction_10m_dominant',
    'sunrise',
    'sunset'
  ]

  for (const field of requiredArrays) {
    if (!Array.isArray(data.daily[field]) || data.daily[field].length === 0) {
      throw new Error(`Fehlende oder ungültige Daten für ${field}`)
    }
  }
}

export async function GET(request: Request) {
  try {
    console.log('Starte Wettervorhersage-Aktualisierung...')

    // Extrahiere Test-Parameter aus der URL
    const url = new URL(request.url)
    const testCase = url.searchParams.get('test')
    
    console.log('Test-Fall:', testCase || 'keiner')

    // 1. API-Anfrage mit Timeout und Fehlerbehandlung
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const forecastResponse = await simulateError(testCase)
      clearTimeout(timeout)

      if (!forecastResponse.ok) {
        throw new Error(`Wetter-API Fehler: ${forecastResponse.status} ${forecastResponse.statusText}`)
      }

      const forecastData = await forecastResponse.json()

      // 2. Validiere API-Antwort
      validateForecastResponse(forecastData)

      console.log('API-Antwort erfolgreich validiert')

      // 3. Datenbankoperationen mit Fehlerbehandlung
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('name', 'Hohenmölsen')
        .single()

      if (locationError) {
        if (locationError.code === 'PGRST116') {
          throw new Error('Standort Hohenmölsen nicht in der Datenbank gefunden')
        }
        throw new Error(`Datenbankfehler beim Abrufen des Standorts: ${locationError.message}`)
      }

      if (!locationData?.id) {
        throw new Error('Keine location_id gefunden')
      }

      // 4. Datenaufbereitung und Speicherung
      const dailyForecasts = forecastData.daily.time.map((date: string, index: number) => ({
        location_id: locationData.id,
        forecast_date: date,
        temperature_min: Number(forecastData.daily.temperature_2m_min[index]),
        temperature_max: Number(forecastData.daily.temperature_2m_max[index]),
        precipitation_sum: Number(forecastData.daily.precipitation_sum[index] ?? 0),
        precipitation_probability: Number(forecastData.daily.precipitation_probability_max[index] ?? 0),
        weather_code: Number(forecastData.daily.weather_code[index] ?? 0),
        wind_speed_max: Number(forecastData.daily.wind_speed_10m_max[index]),
        wind_gusts_max: Number(forecastData.daily.wind_gusts_10m_max[index] ?? 0),
        wind_direction_dominant: Number(forecastData.daily.wind_direction_10m_dominant[index] ?? 0),
        sunrise: forecastData.daily.sunrise[index],
        sunset: forecastData.daily.sunset[index],
        uv_index_max: Number(forecastData.daily.uv_index_max[index] ?? 0)
      }))

      console.log('Aufbereitete Vorhersagedaten:', dailyForecasts)

      // 5. Datenbank-Update mit detaillierter Fehlerbehandlung
      const { error: forecastError } = await supabase
        .from('daily_forecast')
        .upsert(dailyForecasts, {
          onConflict: 'location_id,forecast_date'
        })

      if (forecastError) {
        if (forecastError.code === '23502') { // not-null violation
          throw new Error(`Pflichtfeld fehlt: ${forecastError.details}`)
        } else if (forecastError.code === '23505') { // unique violation
          throw new Error('Datensatz existiert bereits')
        } else {
          throw new Error(`Datenbankfehler beim Speichern: ${forecastError.message}`)
        }
      }

      console.log('Vorhersagedaten erfolgreich gespeichert')
      
      return NextResponse.json({
        success: true,
        message: 'Wettervorhersage erfolgreich aktualisiert',
        data: dailyForecasts,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden')
      }
      throw error
    }

  } catch (error: any) {
    console.error('Fehler bei der Wettervorhersage-Aktualisierung:', {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    })

    // Kategorisiere Fehler für Frontend
    let statusCode = 500
    let errorType = 'INTERNAL_ERROR'

    if (error.message.includes('API-Timeout')) {
      statusCode = 504
      errorType = 'API_TIMEOUT'
    } else if (error.message.includes('API Fehler')) {
      statusCode = 502
      errorType = 'API_ERROR'
    } else if (error.message.includes('Datenbankfehler')) {
      statusCode = 503
      errorType = 'DATABASE_ERROR'
    } else if (error.message.includes('Validierung') || error.message.includes('ungültig')) {
      statusCode = 422
      errorType = 'VALIDATION_ERROR'
    }

    return NextResponse.json({
      success: false,
      error: {
        type: errorType,
        message: error.message,
        details: error.details || null
      }
    }, { status: statusCode })
  }
} 