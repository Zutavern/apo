'use client'

import { useState, useEffect } from 'react'
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sun, 
  CloudRain, 
  Moon, 
  Heart, 
  Pill, 
  Activity,
  AlertTriangle,
  Flower
} from 'lucide-react'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
    uv_index: number
    pressure_msl: number
    surface_pressure: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
  }
}

type PollenData = {
  hourly: {
    time: string[]
    alder_pollen: number[]
    birch_pollen: number[]
    grass_pollen: number[]
    mugwort_pollen: number[]
    ragweed_pollen: number[]
  }
}

type AirQualityData = {
  current: {
    pm10: number
    pm2_5: number
    nitrogen_dioxide: number
    ozone: number
    european_aqi: number
  }
}

type BiometeoData = {
  circulatory_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  headache_risk: 'Niedrig' | 'Mittel' | 'Hoch'
  rheumatic_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  asthma_risk: 'Niedrig' | 'Mittel' | 'Hoch'
}

type HealthRecommendation = {
  type: 'UV' | 'Hydration' | 'Temperature' | 'Pollen'
  risk_level: 'Niedrig' | 'Mittel' | 'Hoch'
  recommendation: string
}

const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bewölkt',
    45: 'Neblig',
    48: 'Neblig (gefrierend)',
    51: 'Leichter Nieselregen',
    53: 'Mäßiger Nieselregen',
    55: 'Starker Nieselregen',
    61: 'Leichter Regen',
    63: 'Mäßiger Regen',
    65: 'Starker Regen',
    71: 'Leichter Schneefall',
    73: 'Mäßiger Schneefall',
    75: 'Starker Schneefall',
    95: 'Gewitter'
  }
  return weatherCodes[code] || 'Unbekannt'
}

function calculateBiometeoData(weatherData: WeatherData): BiometeoData {
  return {
    circulatory_stress: Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) > 5 ? 'Hoch' : 
                        Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) > 3 ? 'Mittel' : 'Niedrig',
    headache_risk: Math.abs(weatherData.current.pressure_msl - 1013.25) > 10 ? 'Hoch' :
                   Math.abs(weatherData.current.pressure_msl - 1013.25) > 5 ? 'Mittel' : 'Niedrig',
    rheumatic_stress: weatherData.current.relative_humidity_2m > 80 ? 'Hoch' :
                      weatherData.current.relative_humidity_2m > 60 ? 'Mittel' : 'Niedrig',
    asthma_risk: weatherData.current.relative_humidity_2m > 85 || weatherData.current.temperature_2m < 5 ? 'Hoch' :
                 weatherData.current.relative_humidity_2m > 70 || weatherData.current.temperature_2m < 10 ? 'Mittel' : 'Niedrig'
  }
}

function getHealthRecommendations(weatherData: WeatherData, pollenData: PollenData | null = null): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = []

  // UV-Empfehlungen
  if (weatherData.current.uv_index > 5) {
    recommendations.push({
      type: 'UV',
      risk_level: 'Hoch',
      recommendation: 'Hoher UV-Index: Sonnenschutz verwenden, Mittagssonne meiden'
    })
  }

  // Temperatur-Empfehlungen
  if (weatherData.current.temperature_2m > 30) {
    recommendations.push({
      type: 'Temperature',
      risk_level: 'Hoch',
      recommendation: 'Hitzewarnung: Ausreichend trinken, körperliche Aktivität einschränken'
    })
  } else if (weatherData.current.temperature_2m < 5) {
    recommendations.push({
      type: 'Temperature',
      risk_level: 'Mittel',
      recommendation: 'Kältewarnung: Warm kleiden, Erkältungsprophylaxe beachten'
    })
  }

  // Hydratations-Empfehlungen
  if (weatherData.current.relative_humidity_2m < 40) {
    recommendations.push({
      type: 'Hydration',
      risk_level: 'Hoch',
      recommendation: 'Niedrige Luftfeuchtigkeit: Mehr trinken, Schleimhäute befeuchten'
    })
  }

  return recommendations
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [pollenData, setPollenData] = useState<PollenData | null>(null)
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Wetterdaten abrufen
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,is_day,weather_code,uv_index,pressure_msl,surface_pressure,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset,uv_index_max&timezone=Europe%2FBerlin`
        )

        // Pollendaten abrufen
        const pollenResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
        )

        // Luftqualitätsdaten abrufen
        const airQualityResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi`
        )

        if (!weatherResponse.ok || !pollenResponse.ok || !airQualityResponse.ok) {
          throw new Error('Fehler beim Abrufen der Daten')
        }

        const [weatherData, pollenData, airQualityData] = await Promise.all([
          weatherResponse.json(),
          pollenResponse.json(),
          airQualityResponse.json()
        ])

        setWeatherData(weatherData)
        setPollenData(pollenData)
        setAirQualityData(airQualityData)
      } catch (err) {
        console.error('Fetch Error:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Berechne Biometeorologie-Daten
  const biometeoData = weatherData ? calculateBiometeoData(weatherData) : null
  
  // Generiere Gesundheitsempfehlungen
  const healthRecommendations = weatherData ? getHealthRecommendations(weatherData, pollenData) : []

  console.log('Current State:', {
    isLoading,
    error,
    weatherData: weatherData ? JSON.stringify(weatherData, null, 2) : null
  })

  const getCurrentPollenData = (pollenData: PollenData | null) => {
    if (!pollenData) return null;
    
    const currentHour = new Date().getHours();
    return {
      alder: pollenData.hourly.alder_pollen[currentHour] || 0,
      birch: pollenData.hourly.birch_pollen[currentHour] || 0,
      grass: pollenData.hourly.grass_pollen[currentHour] || 0,
      mugwort: pollenData.hourly.mugwort_pollen[currentHour] || 0,
      ragweed: pollenData.hourly.ragweed_pollen[currentHour] || 0
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-gray-500">
          Wetterdaten werden geladen...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-red-500">
          Fehler: {error}
        </div>
      </div>
    )
  }

  if (!weatherData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-red-500">
          Keine Wetterdaten verfügbar
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        {weatherData && (
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            {weatherData.current.is_day ? (
              <>
                <Sun className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-300">Tag</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-blue-300" />
                <span className="text-gray-300">Nacht</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {weatherData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Aktuelle Wetterkarte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Cloud className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Aktuelles Wetter</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-blue-500" />
                  <span>Temperatur</span>
                </div>
                <span className="font-medium">{weatherData.current.temperature_2m}°C</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span>Luftfeuchtigkeit</span>
                </div>
                <span className="font-medium">{weatherData.current.relative_humidity_2m}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <span>Windgeschwindigkeit</span>
                </div>
                <span className="font-medium">{weatherData.current.wind_speed_10m} km/h</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  <span>Niederschlag</span>
                </div>
                <span className="font-medium">{weatherData.current.precipitation} mm</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  {weatherData.current.is_day ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-blue-300" />
                  )}
                  <span>Wetter</span>
                </div>
                <span className="font-medium">{getWeatherDescription(weatherData.current.weather_code)}</span>
              </div>
            </div>
          </div>

          {/* Gesundheitsindices */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-6 w-6 text-yellow-500" />
              <h2 className="text-lg font-medium">Gesundheitsindices</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span>UV-Index</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    weatherData.current.uv_index <= 2 ? 'bg-green-500/20 text-green-500' :
                    weatherData.current.uv_index <= 5 ? 'bg-yellow-500/20 text-yellow-500' :
                    weatherData.current.uv_index <= 7 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {weatherData.current.uv_index.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  <span>Gefühlt</span>
                </div>
                <span className="font-medium">{weatherData.current.apparent_temperature}°C</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <span>Luftdruck</span>
                </div>
                <span className="font-medium">{weatherData.current.pressure_msl} hPa</span>
              </div>
            </div>
          </div>

          {/* Pollenflug-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Flower className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-medium">Pollenflug</h2>
            </div>
            <div className="space-y-4">
              {pollenData && Object.entries(getCurrentPollenData(pollenData) || {}).map(([pollen, value]) => (
                <div key={pollen} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span className="capitalize">
                    {pollen === 'alder' ? 'Erle' :
                     pollen === 'birch' ? 'Birke' :
                     pollen === 'grass' ? 'Gräser' :
                     pollen === 'mugwort' ? 'Beifuß' :
                     'Ambrosia'}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    value === 0 ? 'bg-green-500/20 text-green-500' :
                    value <= 2 ? 'bg-yellow-500/20 text-yellow-500' :
                    value <= 4 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {value === 0 ? 'Keine' :
                     value <= 2 ? 'Gering' :
                     value <= 4 ? 'Mittel' :
                     'Hoch'}
                  </span>
                </div>
              ))}
              {!pollenData && (
                <div className="text-center text-gray-400 p-4">
                  Keine Pollendaten verfügbar
                </div>
              )}
            </div>
          </div>

          {/* Biometeorologie-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-medium">Biometeorologie</h2>
            </div>
            <div className="space-y-4">
              {biometeoData && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Kreislaufbelastung</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.circulatory_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.circulatory_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.circulatory_stress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Kopfschmerz-Risiko</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.headache_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.headache_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.headache_risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Rheuma-Belastung</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.rheumatic_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.rheumatic_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.rheumatic_stress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Asthma-Risiko</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.asthma_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.asthma_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.asthma_risk}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Luftqualität-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Wind className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-medium">Luftqualität</h2>
            </div>
            <div className="space-y-4">
              {airQualityData && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Luftqualitätsindex</span>
                    <span className={`px-2 py-1 rounded ${
                      airQualityData.current.european_aqi <= 20 ? 'bg-green-500/20 text-green-500' :
                      airQualityData.current.european_aqi <= 40 ? 'bg-yellow-500/20 text-yellow-500' :
                      airQualityData.current.european_aqi <= 60 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {airQualityData.current.european_aqi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Feinstaub (PM2.5)</span>
                    <span className="font-medium">{airQualityData.current.pm2_5} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Feinstaub (PM10)</span>
                    <span className="font-medium">{airQualityData.current.pm10} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Ozon</span>
                    <span className="font-medium">{airQualityData.current.ozone} µg/m³</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gesundheitsempfehlungen */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Gesundheitsempfehlungen</h2>
            </div>
            <div className="grid gap-4">
              {healthRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-4">
                    {rec.type === 'UV' && <Sun className="h-5 w-5 text-yellow-500" />}
                    {rec.type === 'Temperature' && <Thermometer className="h-5 w-5 text-red-500" />}
                    {rec.type === 'Hydration' && <Droplets className="h-5 w-5 text-blue-500" />}
                    {rec.type === 'Pollen' && <Flower className="h-5 w-5 text-green-500" />}
                    <span className="text-gray-400">{rec.recommendation}</span>
                  </div>
                  <span className={`px-2 py-1 rounded ${
                    rec.risk_level === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                    rec.risk_level === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {rec.risk_level}
                  </span>
                </div>
              ))}
              {healthRecommendations.length === 0 && (
                <div className="text-center text-gray-400 p-4">
                  Keine besonderen Gesundheitsempfehlungen für heute
                </div>
              )}
            </div>
          </div>

          {/* 7-Tage Vorhersage */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">7-Tage Vorhersage</h2>
            </div>
            <div className="grid gap-4">
              {weatherData.daily.time.map((date, index) => (
                <div key={date} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-gray-400">
                      {getWeatherDescription(weatherData.daily.weather_code[index])}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-500">{weatherData.daily.temperature_2m_min[index]}°C</span>
                    <span>-</span>
                    <span className="text-red-500">{weatherData.daily.temperature_2m_max[index]}°C</span>
                    <span className="text-gray-400">{weatherData.daily.precipitation_sum[index]} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 