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

export async function GET() {
  try {
    // Hole die aktuellsten Wetterdaten aus der Datenbank
    const { data: weatherData, error } = await supabase
      .from('current_weather_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Fehler beim Abrufen der Wetterdaten:', error)
      throw new Error('Fehler beim Abrufen der Wetterdaten')
    }

    if (!weatherData) {
      throw new Error('Keine Wetterdaten gefunden')
    }

    return NextResponse.json({ 
      success: true,
      data: weatherData 
    })

  } catch (error) {
    console.error('Fehler in /api/weather/current:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Abrufen der Wetterdaten' 
      },
      { status: 500 }
    )
  }
}

// Hilfsfunktionen
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getUVWarningLevel(uvIndex: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (uvIndex >= 8) return 'extreme'
  if (uvIndex >= 6) return 'high'
  if (uvIndex >= 3) return 'medium'
  return 'low'
}

function getWeatherIcon(code: number): string {
  // Basis-Mapping von Wettercodes zu Icons
  const iconMap: { [key: number]: string } = {
    0: 'Sun',        // Klar
    1: 'SunDim',     // Überwiegend klar
    2: 'Cloud',      // Teilweise bewölkt
    3: 'CloudSun',   // Bewölkt
    45: 'CloudFog',  // Neblig
    48: 'CloudFog',  // Neblig mit Reif
    51: 'CloudDrizzle', // Leichter Nieselregen
    53: 'CloudRain',    // Mäßiger Nieselregen
    55: 'CloudRain',    // Starker Nieselregen
    61: 'CloudRain',    // Leichter Regen
    63: 'CloudRain',    // Mäßiger Regen
    65: 'CloudRain',    // Starker Regen
    71: 'CloudSnow',    // Leichter Schneefall
    73: 'CloudSnow',    // Mäßiger Schneefall
    75: 'CloudSnow',    // Starker Schneefall
    77: 'CloudSnow',    // Schneegriesel
    80: 'CloudRain',    // Leichte Regenschauer
    81: 'CloudRain',    // Mäßige Regenschauer
    82: 'CloudRain',    // Starke Regenschauer
    85: 'CloudSnow',    // Leichte Schneeschauer
    86: 'CloudSnow',    // Starke Schneeschauer
    95: 'CloudLightning', // Gewitter
    96: 'CloudLightning', // Gewitter mit Hagel
    99: 'CloudLightning'  // Starkes Gewitter mit Hagel
  }
  return iconMap[code] || 'Cloud'
} 