'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Flower2, Leaf, Wind } from 'lucide-react'

interface PollenData {
  hourly: {
    time: string[]
    dust: number[]
    alder_pollen: number[]
    birch_pollen: number[]
    grass_pollen: number[]
    mugwort_pollen: number[]
    ragweed_pollen: number[]
  }
}

type LayoutType = 'single' | 'double' | 'triple'

interface PollenCardProps {
  layout?: LayoutType
}

export function PollenCard({ layout = 'single' }: PollenCardProps) {
  const [pollenData, setPollenData] = useState<PollenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggled, setIsToggled] = useState(false)

  useEffect(() => {
    async function fetchPollenData() {
      try {
        const response = await fetch('/api/weather/pollen')
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Pollendaten')
        }
        const data = await response.json()
        if (data.success) {
          setPollenData(data.data)
        } else {
          throw new Error(data.error || 'Fehler beim Laden der Pollendaten')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPollenData()
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

  if (!pollenData) return null

  // Berechne den aktuellen Index (nächste volle Stunde)
  const currentHour = new Date().getHours()
  const currentIndex = pollenData.hourly.time.findIndex(time => 
    new Date(time).getHours() === currentHour
  )

  // Bestimme Belastungsstufe
  const getPollenLevel = (value: number) => {
    if (value <= 0.5) return { text: 'Keine', color: 'text-gray-400' }
    if (value <= 1.5) return { text: 'Gering', color: 'text-gray-600' }
    if (value <= 2.5) return { text: 'Mittel', color: 'text-gray-800' }
    return { text: 'Hoch', color: 'text-black' }
  }

  // Formatiere den Zeitraum
  const formatTimeRange = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(end.getHours() + (isToggled ? 24 : 6))
    return `${now.getHours()}:00 - ${end.getHours()}:00 Uhr`
  }

  // Berechne Durchschnittswerte für den gewählten Zeitraum
  const getAverageValues = () => {
    const hours = isToggled ? 24 : 6
    const values = {
      alder: 0,
      birch: 0,
      grass: 0,
      mugwort: 0,
      ragweed: 0,
      dust: 0
    }

    for (let i = currentIndex; i < currentIndex + hours && i < pollenData.hourly.time.length; i++) {
      values.alder += pollenData.hourly.alder_pollen[i]
      values.birch += pollenData.hourly.birch_pollen[i]
      values.grass += pollenData.hourly.grass_pollen[i]
      values.mugwort += pollenData.hourly.mugwort_pollen[i]
      values.ragweed += pollenData.hourly.ragweed_pollen[i]
      values.dust += pollenData.hourly.dust[i]
    }

    return {
      alder: values.alder / hours,
      birch: values.birch / hours,
      grass: values.grass / hours,
      mugwort: values.mugwort / hours,
      ragweed: values.ragweed / hours,
      dust: values.dust / hours
    }
  }

  const averageValues = getAverageValues()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Pollenbelastung in Hohenmölsen</CardTitle>
        <Switch checked={isToggled} onCheckedChange={setIsToggled} />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-400 mb-4">
          Vorhersage für {formatTimeRange()}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Flower2 className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Erle</div>
              <div className="text-base font-semibold text-black">
                {getPollenLevel(averageValues.alder).text}
              </div>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Flower2 className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Birke</div>
              <div className="text-base font-semibold text-black">
                {getPollenLevel(averageValues.birch).text}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Leaf className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Gräser</div>
              <div className="text-base font-semibold text-black">
                {getPollenLevel(averageValues.grass).text}
              </div>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Leaf className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Beifuß</div>
              <div className="text-base font-semibold text-black">
                {getPollenLevel(averageValues.mugwort).text}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Leaf className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Ragweed</div>
              <div className="text-base font-semibold text-black">
                {getPollenLevel(averageValues.ragweed).text}
              </div>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              <Wind className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-sm text-gray-400 mb-2">Feinstaub</div>
              <div className="text-base font-semibold text-black">
                {averageValues.dust.toFixed(1)} µg/m³
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
