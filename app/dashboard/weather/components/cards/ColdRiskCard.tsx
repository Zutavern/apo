'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Thermometer, Droplets, CloudRain } from 'lucide-react'

interface ColdRiskData {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    precipitation: number[]
  }
  current_weather: {
    temperature: number
    windspeed: number
    winddirection: number
    weathercode: number
    time: string
  }
}

type LayoutType = 'single' | 'double' | 'triple'

interface ColdRiskCardProps {
  layout?: LayoutType
  isDarkMode?: boolean
}

export function ColdRiskCard({ layout = 'single', isDarkMode = false }: ColdRiskCardProps) {
  const [coldRiskData, setColdRiskData] = useState<ColdRiskData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchColdRiskData() {
      try {
        // Erstelle Fallback-Daten
        const fallbackData = {
          hourly: {
            time: Array(24).fill(new Date().toISOString()),
            temperature_2m: Array(24).fill(20),
            relative_humidity_2m: Array(24).fill(50),
            precipitation: Array(24).fill(0)
          },
          current_weather: {
            temperature: 20,
            windspeed: 0,
            winddirection: 0,
            weathercode: 0,
            time: new Date().toISOString()
          }
        }

        const response = await fetch('/api/weather/forecast')
        
        if (!response.ok) {
          console.warn('Verwende Fallback-Daten aufgrund eines API-Fehlers')
          setColdRiskData(fallbackData)
          return
        }

        const result = await response.json()
        
        if (!result.success || !result.data?.hourly || !result.data?.current_weather) {
          console.warn('Ungültige API-Antwort, verwende Fallback-Daten')
          setColdRiskData(fallbackData)
          return
        }

        setColdRiskData({
          hourly: {
            time: result.data.hourly.time || fallbackData.hourly.time,
            temperature_2m: result.data.hourly.temperature_2m || fallbackData.hourly.temperature_2m,
            relative_humidity_2m: result.data.hourly.relative_humidity_2m || fallbackData.hourly.relative_humidity_2m,
            precipitation: result.data.hourly.precipitation || fallbackData.hourly.precipitation
          },
          current_weather: result.data.current_weather || fallbackData.current_weather
        })
      } catch (err) {
        console.error('Fehler beim Laden der Erkältungsrisiko-Daten:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchColdRiskData()
  }, [])

  if (isLoading) {
    return (
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
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
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[200px] text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!coldRiskData) return null

  const currentTime = new Date()
  const currentIndex = currentTime.getHours()
  const nextIndex = (currentIndex + 6) % 24

  // Berechne das Erkältungsrisiko (0-10)
  const calculateColdRisk = () => {
    const temp = coldRiskData.current_weather.temperature
    const nextTemp = coldRiskData.hourly.temperature_2m[nextIndex] || temp
    const tempChange = Math.abs(nextTemp - temp)
    const humidity = coldRiskData.hourly.relative_humidity_2m[currentIndex] || 50
    const precipitation = coldRiskData.hourly.precipitation[currentIndex] || 0

    let risk = 0

    // Temperatur (0-4 Punkte)
    if (temp < 5) risk += 4
    else if (temp < 10) risk += 3
    else if (temp < 15) risk += 2
    else if (temp < 20) risk += 1

    // Temperaturschwankung (0-2 Punkte)
    if (tempChange > 8) risk += 2
    else if (tempChange > 5) risk += 1

    // Luftfeuchtigkeit (0-2 Punkte)
    if (humidity > 80) risk += 2
    else if (humidity > 60) risk += 1

    // Niederschlag (0-2 Punkte)
    if (precipitation > 5) risk += 2
    else if (precipitation > 0) risk += 1

    return risk
  }

  const coldRisk = calculateColdRisk()

  const getColdRiskLevel = (value: number) => {
    if (value <= 2) return { text: 'Sehr niedrig', color: 'text-green-500', advice: 'Normales Verhalten, keine besonderen Maßnahmen nötig' }
    if (value <= 4) return { text: 'Niedrig', color: 'text-blue-500', advice: 'Leichte Vorsicht bei längeren Aufenthalten im Freien' }
    if (value <= 6) return { text: 'Mittel', color: 'text-yellow-500', advice: 'Auf angemessene Kleidung achten, Temperaturwechsel vermeiden' }
    if (value <= 8) return { text: 'Hoch', color: 'text-orange-500', advice: 'Warme Kleidung tragen, Aufenthalt im Nassen vermeiden' }
    return { text: 'Sehr hoch', color: 'text-red-500', advice: 'Besondere Vorsicht geboten, Immunsystem stärken' }
  }

  const level = getColdRiskLevel(coldRisk)

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Erkältungsrisiko Hohenmölsen</CardTitle>
        <Switch />
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm mb-4`}>
          <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{coldRisk}/10</div>
          <div className={`text-lg font-semibold ${level.color} mb-4`}>
            {level.text}
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} text-center`}>
            {level.advice}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <Thermometer className="h-8 w-8 text-blue-500 mb-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-1`}>Temperatur</div>
            <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {coldRiskData.current_weather.temperature.toFixed(1)}°C
            </div>
          </div>
          <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <Droplets className="h-8 w-8 text-blue-500 mb-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-1`}>Luftfeuchte</div>
            <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {(coldRiskData.hourly.relative_humidity_2m[currentIndex] || 50).toFixed(0)}%
            </div>
          </div>
          <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <CloudRain className="h-8 w-8 text-blue-500 mb-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-1`}>Niederschlag</div>
            <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {(coldRiskData.hourly.precipitation[currentIndex] || 0).toFixed(1)} mm
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
