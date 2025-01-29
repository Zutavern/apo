'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeatherIcon } from '@/lib/weather/icons'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface DailyForecast {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
  weather_code: number[]
  sunrise: string[]
  sunset: string[]
  uv_index_max: number[]
}

type LayoutType = 'single' | 'double' | 'triple'

interface ForecastCardProps {
  layout?: LayoutType
  isDarkMode?: boolean
}

export function ForecastCard({ layout = 'single', isDarkMode = false }: ForecastCardProps) {
  const [forecastData, setForecastData] = useState<DailyForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggled, setIsToggled] = useState(false)

  useEffect(() => {
    async function fetchForecastData() {
      try {
        const response = await fetch('/api/weather/forecast')
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Vorhersagedaten')
        }
        const result = await response.json()
        
        // Debug-Logging
        console.log('Vorhersage API Antwort:', result)
        
        if (!result.success || !result.data?.daily) {
          throw new Error('Ungültige Datenstruktur in der API-Antwort')
        }
        
        setForecastData(result.data.daily)
      } catch (err) {
        console.error('Fehler beim Laden der Vorhersagedaten:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForecastData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGridClass = () => {
    switch (layout) {
      case 'single':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7'
      case 'double':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
      case 'triple':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7'
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

  if (!forecastData?.time) return null

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>
          7-Tage-Vorhersage Hohenmölsen
        </CardTitle>
        <Switch checked={isToggled} onCheckedChange={setIsToggled} />
      </CardHeader>
      <CardContent>
        <div className={`grid ${getGridClass()} gap-4 divide-gray-200`}>
          {forecastData.time.map((date, index) => {
            const WeatherIcon = getWeatherIcon(forecastData.weather_code[index])
            const isToday = new Date(date).toDateString() === new Date().toDateString()
            return (
              <div
                key={date}
                className={`flex flex-col items-center justify-center p-4 relative rounded-lg border min-h-[200px] ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                } ${
                  isToday 
                    ? `${isDarkMode ? 'bg-gray-700' : 'bg-white'} border-blue-500` 
                    : isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-lg" />
                )}
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-2`}>
                  {formatDate(date)}
                </div>
                <WeatherIcon className="h-10 w-10 text-blue-500 mb-2" />
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                    {forecastData.temperature_2m_max[index].toFixed(0)}°
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                    {forecastData.temperature_2m_min[index].toFixed(0)}°
                  </span>
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                  {forecastData.precipitation_sum[index]} mm
                </div>
                {isToggled && (
                  <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} w-full text-center`}>
                    <div>↑ {formatTime(forecastData.sunrise[index])}</div>
                    <div>↓ {formatTime(forecastData.sunset[index])}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 
