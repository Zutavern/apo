import { NextResponse } from 'next/server'

const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

export async function GET() {
  try {
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen&timezone=Europe/Berlin`
    )

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der API-Daten')
    }

    const data = await response.json()

    return NextResponse.json({ 
      success: true, 
      data: data 
    })
  } catch (error) {
    console.error('Fehler in /api/weather/pollen:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Abrufen der Pollendaten' },
      { status: 500 }
    )
  }
} 