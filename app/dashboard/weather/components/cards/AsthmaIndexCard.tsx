'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, Wind } from 'lucide-react'

interface AsthmaData {
  hourly: {
    time: string[]
    dust: number[]
    relative_humidity_2m: number[]
    temperature_2m: number[]
  }
}

type LayoutType = 'single' | 'double' | 'triple'

interface AsthmaIndexCardProps {
  layout?: LayoutType
}

export function AsthmaIndexCard({ layout = 'single' }: AsthmaIndexCardProps) {
  const [asthmaData, setAsthmaData] = useState<AsthmaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAsthmaData() {
      try {
        const [forecastResponse, airQualityResponse] = await Promise.all([
          fetch('/api/weather/forecast'),
          fetch('/api/weather/pollen')
        ])

        if (!forecastResponse.ok || !airQualityResponse.ok) {
          throw new Error('Fehler beim Laden der Daten')
        }

        const [forecastData, airQualityData] = await Promise.all([
          forecastResponse.json(),
          airQualityResponse.json()
        ])

        if (forecastData.success && airQualityData.success) {
          // Kombiniere die Daten
          const combinedData = {
            hourly: {
              time: forecastData.data.hourly.time,
              dust: airQualityData.data.hourly.dust,
              relative_humidity_2m: forecastData.data.hourly.relative_humidity_2m,
              temperature_2m: forecastData.data.hourly.temperature_2m
            }
          }
          setAsthmaData(combinedData)
        } else {
          throw new Error('Fehler beim Laden der Daten')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAsthmaData()
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

  if (!asthmaData) return null

  const currentIndex = new Date().getHours()
  
  // Berechne den Asthma-Index (0-10)
  const calculateAsthmaIndex = () => {
    const dust = asthmaData.hourly.dust[currentIndex]
    const humidity = asthmaData.hourly.relative_humidity_2m[currentIndex]
    const temp = asthmaData.hourly.temperature_2m[currentIndex]

    let index = 0

    // Feinstaubbelastung (0-4 Punkte)
    if (dust <= 10) index += 0
    else if (dust <= 20) index += 1
    else if (dust <= 35) index += 2
    else if (dust <= 50) index += 3
    else index += 4

    // Luftfeuchtigkeit (0-3 Punkte)
    if (humidity <= 40) index += 0
    else if (humidity <= 60) index += 1
    else if (humidity <= 80) index += 2
    else index += 3

    // Temperatur (0-3 Punkte)
    if (temp >= 15 && temp <= 25) index += 0
    else if (temp >= 10 && temp <= 30) index += 1
    else if (temp >= 5 && temp <= 35) index += 2
    else index += 3

    return index
  }

  const asthmaIndex = calculateAsthmaIndex()

  const getAsthmaLevel = (value: number) => {
    if (value <= 2) return { text: 'Sehr gut', color: 'text-green-500', advice: 'Ideale Bedingungen für Aktivitäten im Freien' }
    if (value <= 4) return { text: 'Gut', color: 'text-blue-500', advice: 'Gute Bedingungen, normale Vorsichtsmaßnahmen' }
    if (value <= 6) return { text: 'Mittel', color: 'text-yellow-500', advice: 'Erhöhte Vorsicht bei längeren Aktivitäten im Freien' }
    if (value <= 8) return { text: 'Schlecht', color: 'text-orange-500', advice: 'Aktivitäten im Freien reduzieren, Medikamente bereithalten' }
    return { text: 'Sehr schlecht', color: 'text-red-500', advice: 'Aufenthalt im Freien vermeiden, Notfallmedikamente griffbereit haben' }
  }

  const level = getAsthmaLevel(asthmaIndex)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Asthma-Index Hohenmölsen</CardTitle>
        <Stethoscope className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm mb-4">
          <div className="text-4xl font-bold mb-2">{asthmaIndex}/10</div>
          <div className={`text-lg font-semibold ${level.color} mb-4`}>
            {level.text}
          </div>
          <div className="text-sm text-gray-400 text-center">
            {level.advice}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
            <Wind className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-sm text-gray-400 mb-1">Feinstaub</div>
            <div className="text-base font-semibold text-black">
              {asthmaData.hourly.dust[currentIndex].toFixed(1)} µg/m³
            </div>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-400 mb-1">Luftfeuchte</div>
            <div className="text-base font-semibold text-black">
              {asthmaData.hourly.relative_humidity_2m[currentIndex].toFixed(0)}%
            </div>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-400 mb-1">Temperatur</div>
            <div className="text-base font-semibold text-black">
              {asthmaData.hourly.temperature_2m[currentIndex].toFixed(1)}°C
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
