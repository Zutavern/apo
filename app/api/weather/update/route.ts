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

// Validierungsfunktionen
const isValidWeatherData = (data: any) => {
  const requiredFields = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
    'pressure_msl',
    'wind_speed_10m',
    'is_day'
  ]
  
  return requiredFields.every(field => {
    const value = data[field]
    return value !== undefined && value !== null && !isNaN(value)
  })
}

const validateWeatherResponse = (data: any) => {
  if (!data || !data.current) {
    throw new Error('Ungültiges Antwortformat von Open-Meteo')
  }
  
  if (!isValidWeatherData(data.current)) {
    throw new Error('Fehlende oder ungültige Wetterdaten in der API-Antwort')
  }
}

// Simulierte Fehler für Tests
const simulateError = (errorType: string) => {
  switch (errorType) {
    case 'timeout':
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden'))
        }, 5100)
      })
    case 'invalid':
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          current: {
            temperature_2m: 'ungültig',
            relative_humidity_2m: null,
            precipitation: undefined,
            pressure_msl: NaN,
            wind_speed_10m: 'error',
            is_day: 'tag'
          }
        })
      })
    case 'database':
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          current: {
            temperature_2m: 999999999, // Zu groß für DECIMAL(4,1)
            relative_humidity_2m: 92,
            apparent_temperature: -0.3,
            precipitation: 0,
            pressure_msl: 1038.7,
            surface_pressure: 1021.4,
            wind_speed_10m: 4.5,
            wind_direction_10m: 194,
            is_day: 0
          }
        })
      })
    default:
      return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,is_day&timezone=Europe%2FBerlin`)
  }
}

export async function GET(request: Request) {
  try {
    console.log('Starte Wetteraktualisierung...')

    // Extrahiere Test-Parameter aus der URL
    const url = new URL(request.url)
    const testCase = url.searchParams.get('test')
    
    console.log('Test-Fall:', testCase || 'keiner')

    // 1. API-Anfragen mit Timeout und Fehlerbehandlung
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      // Verwende simulierte oder echte API basierend auf Test-Parameter
      const [weatherResponse, pollenResponse] = await Promise.all([
        simulateError(testCase || ''),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`, {
          signal: controller.signal
        })
      ])
      clearTimeout(timeout)

      if (!weatherResponse.ok) {
        throw new Error(`Wetter-API Fehler: ${weatherResponse.status} ${weatherResponse.statusText}`)
      }
      if (!pollenResponse.ok) {
        throw new Error(`Pollen-API Fehler: ${pollenResponse.status} ${pollenResponse.statusText}`)
      }

      const weatherData = await weatherResponse.json()
      const pollenData = await pollenResponse.json()

      // 2. Validiere API-Antwort
      validateWeatherResponse(weatherData)

      console.log('API-Antwort erfolgreich validiert')
      console.log('Rohdaten von API:', weatherData.current)

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

      // 4. Datenaufbereitung mit Validierung
      const currentWeatherData = {
        location_id: locationData.id,
        temperature: Number(weatherData.current.temperature_2m),
        humidity: Number(weatherData.current.relative_humidity_2m),
        feels_like: Number(weatherData.current.apparent_temperature ?? weatherData.current.temperature_2m),
        precipitation: Number(weatherData.current.precipitation ?? 0),
        wind_speed: Number(weatherData.current.wind_speed_10m),
        weather_code: Number(weatherData.current.weather_code ?? 0),
        is_day: Boolean(weatherData.current.is_day),
        uv_index: Number(weatherData.current.uv_index ?? 0),
        pressure: Number(weatherData.current.pressure_msl),
        surface_pressure: Number(weatherData.current.surface_pressure ?? weatherData.current.pressure_msl)
      }

      // Validiere aufbereitete Daten
      Object.entries(currentWeatherData).forEach(([key, value]) => {
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
          throw new Error(`Ungültiger Wert für ${key}: ${value}`)
        }
      })

      console.log('Aufbereitete Daten für DB:', currentWeatherData)

      // 5. Datenbank-Update mit detaillierter Fehlerbehandlung
      const { error: weatherError } = await supabase
        .from('current_weather')
        .upsert(currentWeatherData, {
          onConflict: 'location_id'
        })

      if (weatherError) {
        if (weatherError.code === '23502') { // not-null violation
          throw new Error(`Pflichtfeld fehlt: ${weatherError.details}`)
        } else if (weatherError.code === '23505') { // unique violation
          throw new Error('Datensatz existiert bereits')
        } else {
          throw new Error(`Datenbankfehler beim Speichern: ${weatherError.message}`)
        }
      }

      console.log('Wetterdaten erfolgreich gespeichert')
      
      return NextResponse.json({
        success: true,
        message: 'Wetterdaten erfolgreich aktualisiert',
        data: currentWeatherData,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden')
      }
      throw error
    }

  } catch (error: any) {
    console.error('Fehler bei der Wetteraktualisierung:', {
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