'use client'

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain, AlertTriangle } from 'lucide-react'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
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
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Europe%2FBerlin`
          ),
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
          )
        ])
        
        if (!weatherResponse.ok || !pollenResponse.ok) 
          throw new Error('Daten konnten nicht geladen werden')
        
        const [weatherData, pollenData] = await Promise.all([
          weatherResponse.json(),
          pollenResponse.json()
        ])

        // Generiere Warnungen basierend auf den Wetterdaten
        const warnings: WeatherWarning[] = []
        
        // Prüfe auf starke Niederschläge
        if (weatherData.daily.precipitation_sum[0] > 10) {
          warnings.push({
            event: 'Starker Niederschlag',
            start: weatherData.daily.time[0],
            end: weatherData.daily.time[0],
            description: `Erwartete Niederschlagsmenge: ${weatherData.daily.precipitation_sum[0]}mm`,
            severity: weatherData.daily.precipitation_sum[0] > 20 ? 'Severe' : 'Moderate'
          })
        }

        // Prüfe auf hohe Niederschlagswahrscheinlichkeit
        if (weatherData.daily.precipitation_probability_max[0] > 70) {
          warnings.push({
            event: 'Hohe Niederschlagswahrscheinlichkeit',
            start: weatherData.daily.time[0],
            end: weatherData.daily.time[0],
            description: `Niederschlagswahrscheinlichkeit: ${weatherData.daily.precipitation_probability_max[0]}%`,
            severity: 'Minor'
          })
        }

        // Prüfe auf extreme Temperaturen
        const maxTemp = weatherData.daily.temperature_2m_max[0]
        const minTemp = weatherData.daily.temperature_2m_min[0]
        
        if (maxTemp > 30) {
          warnings.push({
            event: 'Hitzewarnung',
            start: weatherData.daily.time[0],
            end: weatherData.daily.time[0],
            description: `Maximale Temperatur: ${maxTemp}°C`,
            severity: maxTemp > 35 ? 'Extreme' : 'Severe'
          })
        }
        
        if (minTemp < 0) {
          warnings.push({
            event: 'Frost',
            start: weatherData.daily.time[0],
            end: weatherData.daily.time[0],
            description: `Minimale Temperatur: ${minTemp}°C`,
            severity: minTemp < -5 ? 'Severe' : 'Moderate'
          })
        }

        // Berechne den Durchschnitt der Pollenwerte für heute
        const currentHour = new Date().getHours()
        const todayPollenData = {
          alder: Math.round(pollenData.hourly.alder_pollen[currentHour] || 0),
          birch: Math.round(pollenData.hourly.birch_pollen[currentHour] || 0),
          grass: Math.round(pollenData.hourly.grass_pollen[currentHour] || 0),
          mugwort: Math.round(pollenData.hourly.mugwort_pollen[currentHour] || 0),
          ragweed: Math.round(pollenData.hourly.ragweed_pollen[currentHour] || 0)
        }

        setWeatherData(weatherData)
        setPollenData(todayPollenData)
        setWarnings(warnings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeatherData()
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
            </div>
          </div>

          {/* 7-Tage Vorhersage */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
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

          {/* Pollendaten */}
          {pollenData && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Wind className="h-6 w-6 text-green-500" />
                <h2 className="text-lg font-medium">Aktuelle Pollenbelastung</h2>
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
        </div>
      )}
    </div>
  )
} 