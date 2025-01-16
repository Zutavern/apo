'use client'

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain, AlertTriangle, Moon, Umbrella, Heart, Pill, Activity, Clock } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    pressure_msl_mean: number[]
  }
  hourly: {
    temperature_2m: number[]
    relative_humidity_2m: number[]
    pressure_msl: number[]
    time: string[]
  }
}

type PollenData = {
  alder: number
  birch: number
  grass: number
  mugwort: number
  ragweed: number
}

type WeatherWarning = {
  event: string
  start: string
  end: string
  description: string
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme'
}

const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

const SEVERITY_COLORS = {
  Minor: 'yellow',
  Moderate: 'orange',
  Severe: 'red',
  Extreme: 'purple'
}

const SEVERITY_TRANSLATIONS = {
  Minor: 'Leicht',
  Moderate: 'Mäßig',
  Severe: 'Schwer',
  Extreme: 'Extrem'
}

// Typen für Supabase-Daten
type SupabaseCurrentWeather = {
  temperature: number
  humidity: number
  feels_like: number
  precipitation: number
  wind_speed: number
  weather_code: number
  is_day: boolean
  uv_index: number
  pressure: number
  surface_pressure: number
}

type SupabaseDailyForecast = {
  forecast_date: string
  temp_max: number
  temp_min: number
  precipitation_sum: number
  weather_code: number
  sunrise: string
  sunset: string
  uv_index_max: number
  pressure_mean: number
}

type SupabaseHourlyForecast = {
  forecast_time: string
  temperature: number
  humidity: number
  pressure: number
}

type SupabasePollenData = {
  alder_level: 'None' | 'Low' | 'Medium' | 'High'
  birch_level: 'None' | 'Low' | 'Medium' | 'High'
  grass_level: 'None' | 'Low' | 'Medium' | 'High'
  mugwort_level: 'None' | 'Low' | 'Medium' | 'High'
  ragweed_level: 'None' | 'Low' | 'Medium' | 'High'
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

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [pollenData, setPollenData] = useState<PollenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<WeatherWarning[]>([])

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setIsLoading(true)
        
        const [weatherResponse, pollenResponse] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,weather_code,uv_index_max&current=temperature_2m,relative_humidity_2m,precipitation,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,is_day,weather_code,uv_index&timezone=Europe%2FBerlin`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`)
        ])

        if (!weatherResponse.ok || !pollenResponse.ok) {
          throw new Error('Fehler beim Abrufen der Wetterdaten')
        }

        const weatherData = await weatherResponse.json()
        const pollenData = await pollenResponse.json()

        setWeatherData(weatherData)

        // Transformiere die Pollendaten
        const currentHour = new Date().getHours()
        setPollenData({
          alder: pollenData.hourly.alder_pollen[currentHour] || 0,
          birch: pollenData.hourly.birch_pollen[currentHour] || 0,
          grass: pollenData.hourly.grass_pollen[currentHour] || 0,
          mugwort: pollenData.hourly.mugwort_pollen[currentHour] || 0,
          ragweed: pollenData.hourly.ragweed_pollen[currentHour] || 0
        })

        // Generiere Warnungen basierend auf den Wetterdaten
        const newWarnings: WeatherWarning[] = []

        // Starker Niederschlag
        if (weatherData.daily.precipitation_sum[0] > 20) {
          newWarnings.push({
            event: 'Starker Niederschlag',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Sehr hohe Niederschlagsmengen erwartet.',
            severity: 'Severe'
          })
        } else if (weatherData.daily.precipitation_sum[0] > 10) {
          newWarnings.push({
            event: 'Erhöhter Niederschlag',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Erhöhte Niederschlagsmengen erwartet.',
            severity: 'Moderate'
          })
        }

        // Hohe Niederschlagswahrscheinlichkeit
        if (weatherData.daily.precipitation_probability_max[0] > 70) {
          newWarnings.push({
            event: 'Regenwarnung',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Hohe Wahrscheinlichkeit für Niederschlag.',
            severity: 'Minor'
          })
        }

        // Extreme Temperaturen
        if (weatherData.daily.temperature_2m_max[0] > 35) {
          newWarnings.push({
            event: 'Extreme Hitze',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Extrem hohe Temperaturen erwartet.',
            severity: 'Extreme'
          })
        } else if (weatherData.daily.temperature_2m_max[0] > 30) {
          newWarnings.push({
            event: 'Hitzewarnung',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Sehr hohe Temperaturen erwartet.',
            severity: 'Severe'
          })
        }

        if (weatherData.daily.temperature_2m_min[0] < -5) {
          newWarnings.push({
            event: 'Strenger Frost',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Sehr niedrige Temperaturen erwartet.',
            severity: 'Severe'
          })
        } else if (weatherData.daily.temperature_2m_min[0] < 0) {
          newWarnings.push({
            event: 'Frost',
            start: new Date().toISOString(),
            end: new Date(new Date().setHours(23, 59, 59)).toISOString(),
            description: 'Temperaturen unter dem Gefrierpunkt erwartet.',
            severity: 'Moderate'
          })
        }

        setWarnings(newWarnings)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchWeatherData()

    // Aktualisiere alle 30 Minuten
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">Wetter in Hohenmölsen</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-6 animate-pulse">
              <div className="h-6 w-24 bg-gray-700 rounded mb-6"></div>
              <div className="h-16 w-full bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Fehler</h1>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-8">Wetter in Hohenmölsen</h1>
      
      {/* Wetterwarnungen - wenn vorhanden */}
      {warnings.length > 0 && (
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h2 className="text-lg font-medium">Aktuelle Wetterwarnungen</h2>
            </div>
            <div className="space-y-4">
              {warnings.map((warning, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    warning.severity === 'Minor' ? 'border-yellow-700 bg-yellow-950/20' :
                    warning.severity === 'Moderate' ? 'border-orange-700 bg-orange-950/20' :
                    warning.severity === 'Severe' ? 'border-red-700 bg-red-950/20' :
                    'border-purple-700 bg-purple-950/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{warning.event}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      warning.severity === 'Minor' ? 'bg-yellow-500/20 text-yellow-500' :
                      warning.severity === 'Moderate' ? 'bg-orange-500/20 text-orange-500' :
                      warning.severity === 'Severe' ? 'bg-red-500/20 text-red-500' :
                      'bg-purple-500/20 text-purple-500'
                    }`}>
                      {SEVERITY_TRANSLATIONS[warning.severity]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{warning.description}</p>
                  <div className="text-sm text-gray-400">
                    <span>Gültig von: {new Date(warning.start).toLocaleString('de-DE')}</span>
                    <br />
                    <span>Gültig bis: {new Date(warning.end).toLocaleString('de-DE')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {weatherData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Aktuelle Wetterkarte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Cloud className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-medium">Aktuelles Wetter</h2>
              </div>
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
                  <span>Tageszeit</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {weatherData.current.is_day ? 'Tag' : 'Nacht'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {weatherData.current.is_day ? 
                      `Sonnenuntergang: ${new Date(weatherData.daily.sunset[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` :
                      `Sonnenaufgang: ${new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Tage Vorhersage */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Sun className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-medium">7-Tage Vorhersage</h2>
              </div>
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

          {/* Pollendaten */}
          {pollenData && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                  <Wind className="h-6 w-6 text-green-500" />
                  <h2 className="text-lg font-medium">Aktuelle Pollenbelastung</h2>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(pollenData).map(([pollen, value]) => (
                  <div key={pollen} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span className="capitalize">{pollen === 'alder' ? 'Erle' :
                      pollen === 'birch' ? 'Birke' :
                      pollen === 'grass' ? 'Gräser' :
                      pollen === 'mugwort' ? 'Beifuß' :
                      'Ambrosia'}</span>
                    <div className="flex items-center gap-2">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gesundheitsindices */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Umbrella className="h-6 w-6 text-purple-500" />
                <h2 className="text-lg font-medium">Gesundheitsindices</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span>UV-Index</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    (weatherData.current.uv_index || 0) <= 2 ? 'bg-green-500/20 text-green-500' :
                    (weatherData.current.uv_index || 0) <= 5 ? 'bg-yellow-500/20 text-yellow-500' :
                    (weatherData.current.uv_index || 0) <= 7 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {(weatherData.current.uv_index || 0).toFixed(1)}
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

          {/* Biometeorologie */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Heart className="h-6 w-6 text-red-500" />
                <h2 className="text-lg font-medium">Biometeorologie</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-orange-500" />
                  <span>Kreislaufbelastung</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) <= 3 ? 
                    'bg-green-500/20 text-green-500' : 
                    Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) <= 6 ?
                    'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) <= 3 ? 
                      'Gering' : 
                      Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) <= 6 ?
                      'Mittel' : 'Hoch'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-blue-500" />
                  <span>Kopfschmerz-Risiko</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    Math.abs(weatherData.current.pressure_msl - 1013.25) <= 5 ? 
                    'bg-green-500/20 text-green-500' : 
                    Math.abs(weatherData.current.pressure_msl - 1013.25) <= 10 ?
                    'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {Math.abs(weatherData.current.pressure_msl - 1013.25) <= 5 ? 
                      'Gering' : 
                      Math.abs(weatherData.current.pressure_msl - 1013.25) <= 10 ?
                      'Mittel' : 'Hoch'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span>Gelenkschmerz-Risiko</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    weatherData.current.relative_humidity_2m <= 60 ? 
                    'bg-green-500/20 text-green-500' : 
                    weatherData.current.relative_humidity_2m <= 80 ?
                    'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {weatherData.current.relative_humidity_2m <= 60 ? 
                      'Gering' : 
                      weatherData.current.relative_humidity_2m <= 80 ?
                      'Mittel' : 'Hoch'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Erweiterte Allergieinfos */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Pill className="h-6 w-6 text-green-500" />
                <h2 className="text-lg font-medium">Allergie-Prognose</h2>
              </div>
            </div>
            <div className="space-y-4">
              {pollenData && Object.entries(pollenData).map(([pollen, value]) => (
                <div key={pollen} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="capitalize">{pollen === 'alder' ? 'Erle' :
                      pollen === 'birch' ? 'Birke' :
                      pollen === 'grass' ? 'Gräser' :
                      pollen === 'mugwort' ? 'Beifuß' :
                      'Ambrosia'}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
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
                  <div className="text-sm text-gray-400">
                    {value === 0 ? 'Keine besonderen Maßnahmen erforderlich' :
                     value <= 2 ? 'Vorsorglich Medikamente bereithalten' :
                     value <= 4 ? 'Medikamente gemäß ärztlicher Empfehlung einnehmen' :
                     'Aufenthalt im Freien vermeiden, Arzt konsultieren'}
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-400 mt-4">
                <p>Tipp: Bei hoher Pollenbelastung abends duschen und Kleidung nicht im Schlafzimmer ausziehen.</p>
              </div>
            </div>
          </div>

          {/* Spezielle Warnungen */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <h2 className="text-lg font-medium">Spezielle Gesundheitswarnungen</h2>
              </div>
            </div>
            <div className="space-y-4">
              {/* Hitzewarnung für Senioren */}
              {weatherData.current.apparent_temperature > 28 && (
                <div className="p-4 bg-red-950/20 rounded-lg border border-red-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hitzebelastung für Senioren</span>
                    <span className="px-2 py-1 rounded text-sm bg-red-500/20 text-red-500">
                      Erhöht
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Ausreichend Flüssigkeit aufnehmen, körperliche Aktivität einschränken, kühle Räume aufsuchen.
                  </p>
                </div>
              )}

              {/* Kältewarnung für Rheumapatienten */}
              {weatherData.current.temperature_2m < 5 && weatherData.current.relative_humidity_2m > 70 && (
                <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Belastung für Rheumapatienten</span>
                    <span className="px-2 py-1 rounded text-sm bg-blue-500/20 text-blue-500">
                      Erhöht
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Warme Kleidung tragen, Gelenke warm halten, Bewegung im Warmen empfohlen.
                  </p>
                </div>
              )}

              {/* UV-Warnung */}
              {weatherData.current.uv_index > 5 && (
                <div className="p-4 bg-yellow-950/20 rounded-lg border border-yellow-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Hohe UV-Belastung</span>
                    <span className="px-2 py-1 rounded text-sm bg-yellow-500/20 text-yellow-500">
                      Schutz erforderlich
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sonnenschutz verwenden, Mittagssonne meiden, bedeckende Kleidung tragen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gesundheitstipps */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-3 w-2 h-2 rounded-full bg-red-500" title="Daten von API" />
                <Activity className="h-6 w-6 text-green-500" />
                <h2 className="text-lg font-medium">Gesundheitstipps</h2>
              </div>
            </div>
            <div className="space-y-4">
              {/* Aktivitätsempfehlung */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Beste Zeit für Aktivitäten</span>
                </div>
                <p className="text-sm text-gray-400">
                  {weatherData.current.is_day && weatherData.current.temperature_2m > 25 ? 
                    'Aktivitäten auf die frühen Morgenstunden oder den Abend verlegen.' :
                    weatherData.current.temperature_2m < 5 ?
                    'Aktivitäten in die wärmeren Mittagsstunden verlegen.' :
                    'Ideale Bedingungen für Aktivitäten im Freien.'}
                </p>
              </div>

              {/* Medikamententipp */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Medikamenteneinnahme</span>
                </div>
                <p className="text-sm text-gray-400">
                  {weatherData.current.temperature_2m > 25 ? 
                    'Medikamente kühl lagern. Einnahme mit ausreichend Flüssigkeit.' :
                    'Reguläre Einnahme gemäß ärztlicher Anweisung.'}
                </p>
              </div>

              {/* Flüssigkeitsempfehlung */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Flüssigkeitsaufnahme</span>
                </div>
                <p className="text-sm text-gray-400">
                  {weatherData.current.temperature_2m > 25 ? 
                    'Mindestens 2-3 Liter Wasser oder ungesüßten Tee trinken.' :
                    weatherData.current.temperature_2m > 20 ?
                    'Regelmäßig Wasser trinken, mindestens 1,5-2 Liter.' :
                    'Normale Flüssigkeitsaufnahme von 1,5 Litern.'}
                </p>
              </div>

              {weatherData.current.relative_humidity_2m < 40 && (
                <div className="text-sm text-gray-400 mt-4">
                  <p>Tipp: Bei trockener Luft Raumbefeuchter nutzen oder feuchte Handtücher aufhängen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 