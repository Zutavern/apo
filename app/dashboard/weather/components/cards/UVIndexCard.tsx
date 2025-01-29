'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sun } from 'lucide-react'

interface UVData {
  hourly: {
    time: string[]
    uv_index: number[]
  }
  daily: {
    uv_index_max: number[]
  }
}

type LayoutType = 'single' | 'double' | 'triple'

interface UVIndexCardProps {
  layout?: LayoutType
}

export function UVIndexCard({ layout = 'single' }: UVIndexCardProps) {
  const [uvData, setUVData] = useState<UVData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUVData() {
      try {
        const response = await fetch('/api/weather/forecast')
        if (!response.ok) {
          throw new Error('Fehler beim Laden der UV-Daten')
        }
        const result = await response.json()
        
        // Debug-Logging
        console.log('UV-Index API Antwort:', result)
        
        if (!result.success || !result.data?.daily?.uv_index_max) {
          throw new Error('Ungültige Datenstruktur in der API-Antwort')
        }
        
        setUVData(result.data)
      } catch (err) {
        console.error('Fehler beim Laden der UV-Daten:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUVData()
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

  if (!uvData?.daily?.uv_index_max) return null

  const currentIndex = 0 // Heute
  const uvIndex = uvData.daily.uv_index_max[currentIndex]

  const getUVLevel = (value: number) => {
    if (value <= 2) return { text: 'Niedrig', color: 'text-green-500', advice: 'Sonnenschutz nicht erforderlich' }
    if (value <= 5) return { text: 'Mittel', color: 'text-yellow-500', advice: 'Sonnencreme LSF 15+, Sonnenbrille' }
    if (value <= 7) return { text: 'Hoch', color: 'text-orange-500', advice: 'Sonnencreme LSF 30+, Kopfbedeckung, Schatten zwischen 11-15 Uhr' }
    if (value <= 10) return { text: 'Sehr hoch', color: 'text-red-500', advice: 'Sonnencreme LSF 50+, Aufenthalt im Freien vermeiden' }
    return { text: 'Extrem', color: 'text-purple-500', advice: 'Aufenthalt im Freien vermeiden, besondere Schutzmaßnahmen erforderlich' }
  }

  const uvLevel = getUVLevel(uvIndex)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>UV-Index Hohenmölsen</CardTitle>
        <Sun className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
          <div className="text-4xl font-bold mb-2">{uvIndex.toFixed(1)}</div>
          <div className={`text-lg font-semibold ${uvLevel.color} mb-4`}>
            {uvLevel.text}
          </div>
          <div className="text-sm text-gray-400 text-center">
            {uvLevel.advice}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
