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

export async function GET() {
  try {
    // Wetterdaten von Open-Meteo abrufen
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}` +
      '&hourly=temperature_2m,relative_humidity_2m,precipitation,uv_index,surface_pressure,windspeed_10m,winddirection_10m,weathercode' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,sunrise,sunset,uv_index_max,windspeed_10m_max,winddirection_10m_dominant' +
      '&current_weather=true&timezone=Europe/Berlin'
    )

    if (!weatherResponse.ok) {
      throw new Error('Fehler beim Abrufen der Wetterdaten')
    }

    const weatherData = await weatherResponse.json()

    // Debug-Logging
    console.log('Open-Meteo API Antwort:', weatherData)

    // Pollendaten simulieren (da keine echte API verfügbar)
    const pollenData = {
      time: weatherData.daily.time,
      types: {
        graeser: Array(7).fill(Math.floor(Math.random() * 4)),
        birke: Array(7).fill(Math.floor(Math.random() * 4)),
        erle: Array(7).fill(Math.floor(Math.random() * 4)),
        hasel: Array(7).fill(Math.floor(Math.random() * 4)),
        beifuss: Array(7).fill(Math.floor(Math.random() * 4)),
        ambrosia: Array(7).fill(Math.floor(Math.random() * 4))
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        hourly: {
          time: weatherData.hourly.time,
          temperature_2m: weatherData.hourly.temperature_2m,
          relative_humidity_2m: weatherData.hourly.relative_humidity_2m,
          precipitation: weatherData.hourly.precipitation,
          uv_index: weatherData.hourly.uv_index,
          surface_pressure: weatherData.hourly.surface_pressure,
          windspeed_10m: weatherData.hourly.windspeed_10m,
          winddirection_10m: weatherData.hourly.winddirection_10m,
          weathercode: weatherData.hourly.weathercode
        },
        daily: {
          time: weatherData.daily.time,
          temperature_2m_max: weatherData.daily.temperature_2m_max,
          temperature_2m_min: weatherData.daily.temperature_2m_min,
          precipitation_sum: weatherData.daily.precipitation_sum,
          precipitation_probability_max: weatherData.daily.precipitation_probability_max,
          weather_code: weatherData.daily.weathercode,
          sunrise: weatherData.daily.sunrise,
          sunset: weatherData.daily.sunset,
          uv_index_max: weatherData.daily.uv_index_max,
          windspeed_10m_max: weatherData.daily.windspeed_10m_max,
          winddirection_10m_dominant: weatherData.daily.winddirection_10m_dominant
        },
        current_weather: weatherData.current_weather,
        pollen: pollenData
      }
    })
  } catch (error) {
    console.error('Fehler in /api/weather/forecast:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Abrufen der Wetterdaten' },
      { status: 500 }
    )
  }
} 