'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Thermometer, Droplets, ArrowDown, ArrowUp } from 'lucide-react'

interface BioweatherData {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
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

interface BioweatherCardProps {
  layout?: LayoutType
  isDarkMode?: boolean
}

export function BioweatherCard({ layout = 'single', isDarkMode = false }: BioweatherCardProps) {
  const [bioData, setBioData] = useState<BioweatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBioweatherData() {
      try {
        const response = await fetch('/api/weather/forecast')
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Biowetter-Daten')
        }
        const result = await response.json()
        
        // Debug-Logging
        console.log('Biowetter API Antwort:', result)
        
        if (!result.success || !result.data?.hourly || !result.data?.current_weather) {
          throw new Error('Ungültige Datenstruktur in der API-Antwort')
        }
        
        setBioData(result.data)
      } catch (err) {
        console.error('Fehler beim Laden der Biowetter-Daten:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBioweatherData()
  }, [])

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

  if (!bioData?.hourly || !bioData?.current_weather) return null

  const currentTime = new Date()
  const currentIndex = currentTime.getHours()
  const nextIndex = (currentIndex + 6) % 24 // 6 Stunden später

  const currentTemp = bioData.current_weather.temperature
  const nextTemp = bioData.hourly.temperature_2m[nextIndex] || currentTemp
  const tempChange = nextTemp - currentTemp

  // Standardwerte für Luftdruck, da dieser nicht in der API verfügbar ist
  const currentPressure = 1013.25 // Standarddruck als Fallback
  const nextPressure = 1013.25
  const pressureChange = 0

  const humidity = bioData.hourly.relative_humidity_2m[currentIndex] || 50 // Standard-Luftfeuchtigkeit als Fallback

  const getBioweatherAdvice = () => {
    const advices = []

    // Temperaturänderung
    if (Math.abs(tempChange) > 5) {
      advices.push('Starke Temperaturänderung: Kreislaufbelastung möglich')
    }

    // Luftfeuchtigkeit
    if (humidity > 70) {
      advices.push('Hohe Luftfeuchtigkeit: Rheumabeschwerden möglich')
    }

    return advices.length > 0 ? advices : ['Keine besonderen Wetterbelastungen']
  }

  return (
    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>
          Biowetter Hohenmölsen
        </CardTitle>
        <Switch />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
        <div className="grid grid-cols-2 gap-4 mb-4 w-2/3">
          <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <Thermometer className="h-8 w-8 text-blue-500 mb-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-1`}>Temperatur</div>
            <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {currentTemp.toFixed(1)}°C
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} flex items-center`}>
              {tempChange > 0 ? <ArrowUp className="h-4 w-4 text-red-500" /> : <ArrowDown className="h-4 w-4 text-blue-500" />}
              {Math.abs(tempChange).toFixed(1)}°C
            </div>
          </div>
          <div className={`flex flex-col items-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
            <Droplets className="h-8 w-8 text-blue-500 mb-2" />
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'} mb-1`}>Luftfeuchte</div>
            <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              {humidity.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} text-center mt-4`}>
          {getBioweatherAdvice().map((advice, index) => (
            <div key={index} className="mb-1">{advice}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
