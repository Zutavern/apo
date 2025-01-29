import { NextResponse } from 'next/server'

const API_URL = 'https://api.open-meteo.com/v1/forecast'
const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

export async function GET() {
  try {
    const response = await fetch(
      `${API_URL}?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day,uv_index&daily=sunrise,sunset&timezone=Europe/Berlin`
    )

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Wetterdaten')
    }

    const data = await response.json()

    // Kombiniere current und daily Daten
    const combinedData = {
      ...data.current,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0]
    }

    return NextResponse.json({ success: true, data: combinedData })
  } catch (error) {
    console.error('Fehler in /api/weather/current:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Abrufen der Wetterdaten' },
      { status: 500 }
    )
  }
} 