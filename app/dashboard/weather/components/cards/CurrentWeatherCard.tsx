'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, Droplets, Gauge, Sun, SunDim, SunMedium, SunMoon, Umbrella, Wind } from 'lucide-react'
import { getWeatherIcon } from '@/lib/weather/icons'
import { Switch } from '@/components/ui/switch'

interface CurrentWeatherData {
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  surface_pressure: number
  wind_speed_10m: number
  wind_direction_10m: number
  is_day: boolean
  uv_index: number
  sunrise: string
  sunset: string
  is_expanded: boolean
  id: string
}

type LayoutType = 'single' | 'double' | 'triple'

interface CurrentWeatherCardProps {
  layout?: LayoutType
  isDarkMode?: boolean
  showToggle?: boolean
}

export function CurrentWeatherCard({ layout = 'single', isDarkMode = false, showToggle = false }: CurrentWeatherCardProps) {
  const [weatherData, setWeatherData] = useState<CurrentWeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggled, setIsToggled] = useState(false)

  useEffect(() => {
    async function fetchWeatherData() {
      try {
        const response = await fetch('/api/weather/current')
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Wetterdaten')
        }
        const data = await response.json()
        if (data.success) {
          setWeatherData(data.data)
          setIsToggled(data.data.is_expanded)
        } else {
          throw new Error(data.error || 'Fehler beim Laden der Wetterdaten')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeatherData()
  }, [])

  const handleToggle = async (checked: boolean) => {
    if (!weatherData?.id) return

    try {
      const response = await fetch('/api/weather/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: weatherData.id,
          is_expanded: checked
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Status')
      }

      setIsToggled(checked)
    } catch (err) {
      console.error('Fehler beim Toggle:', err)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[200px] text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) return null

  // Wenn wir nicht auf der API-Seite sind (showToggle ist false) und is_expanded false ist,
  // zeigen wir die Karte nicht an
  if (!showToggle && !weatherData.is_expanded) return null

  const WeatherIcon = getWeatherIcon(weatherData.weather_code)

  // Formatiere Sonnenauf- und -untergangszeiten
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // UV-Index Warnstufe
  const getUVWarningColor = (uvIndex: number) => {
    if (uvIndex >= 8) return 'text-red-500'
    if (uvIndex >= 6) return 'text-orange-500'
    if (uvIndex >= 3) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Windrichtung in Text
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  // Grid-Layout basierend auf dem Layout-Typ
  const getGridClass = () => {
    switch (layout) {
      case 'single':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      case 'double':
        return 'grid-cols-1 md:grid-cols-2'
      case 'triple':
        return 'grid-cols-1 md:grid-cols-2'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }
  }

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>
          Aktuelles Wetter in Hohenmölsen
        </CardTitle>
        {showToggle && (
          <Switch
            checked={isToggled}
            onCheckedChange={handleToggle}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className={`grid ${getGridClass()} gap-6`}>
          {/* Temperatur und Wetter-Icon */}
          <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <WeatherIcon className="h-16 w-16 text-blue-500" />
            <div className={`text-4xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {weatherData.temperature_2m.toFixed(1)}°C
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
              Gefühlt wie {weatherData.apparent_temperature.toFixed(1)}°C
            </div>
          </div>

          {/* Luftfeuchtigkeit und Niederschlag */}
          <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-8 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <div className="flex flex-col items-center space-y-2">
              <Droplets className="h-8 w-8 text-blue-500" />
              <div className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                {weatherData.relative_humidity_2m}%
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                Luftfeuchtigkeit
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Umbrella className="h-8 w-8 text-blue-500" />
              <div className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                {weatherData.precipitation.toFixed(1)} mm
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                Niederschlag
              </div>
            </div>
          </div>

          {/* Luftdruck und UV-Index */}
          <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-8 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <div className="flex flex-col items-center space-y-2">
              <Gauge className="h-8 w-8 text-blue-500" />
              <div className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                {weatherData.surface_pressure.toFixed(0)} hPa
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                Luftdruck
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <SunMedium className={`h-8 w-8 ${getUVWarningColor(weatherData.uv_index)}`} />
              <div className={`text-2xl font-semibold ${getUVWarningColor(weatherData.uv_index)}`}>
                {weatherData.uv_index.toFixed(1)}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                UV-Index
              </div>
            </div>
          </div>

          {/* Wind und Sonnenzeiten */}
          <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-8 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <div className="flex flex-col items-center space-y-2">
              <Wind className="h-8 w-8 text-blue-500" />
              <div className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                {weatherData.wind_speed_10m.toFixed(1)} km/h
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                Wind aus {getWindDirection(weatherData.wind_direction_10m)} ({weatherData.wind_direction_10m}°)
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <SunMoon className="h-8 w-8 text-blue-500" />
              <div className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                ↑ {formatTime(weatherData.sunrise)}
              </div>
              <div className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                ↓ {formatTime(weatherData.sunset)}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                Sonnenauf-/untergang
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
