'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CurrentWeatherCard } from '@/app/dashboard/weather/components/cards/CurrentWeatherCard'

interface WeatherBackground {
  id: string
  file_name: string
  bucket_name: string
  storage_path: string
  created_at: string
  is_selected: boolean
}

interface WeatherData {
  temperature_2m_max: number
  temperature_2m_min: number
  precipitation_sum: number
  weather_code: number
  time: string
  is_expanded: boolean
}

export default function WeatherPortrait() {
  const supabase = createClientComponentClient()
  const [selectedImage, setSelectedImage] = useState<WeatherBackground | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)

  useEffect(() => {
    loadSelectedImage()
    loadWeatherData()

    const timeTimer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)

    const weatherTimer = setInterval(() => {
      loadWeatherData()
    }, 900000)

    return () => {
      clearInterval(timeTimer)
      clearInterval(weatherTimer)
    }
  }, [])

  async function loadSelectedImage() {
    try {
      const { data, error } = await supabase
        .from('weather_backgrounds')
        .select('*')
        .eq('orientation', 'portrait')
        .eq('is_selected', true)
        .single()

      if (error) throw error
      setSelectedImage(data)
    } catch (error) {
      console.error('Fehler beim Laden des Hintergrundbildes:', error)
      setImageError(true)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadWeatherData() {
    try {
      // Lade Forecast-Daten
      const forecastResponse = await fetch('/api/weather/forecast/current')
      const forecastData = await forecastResponse.json()
      
      // Lade aktuelle Wetterdaten
      const currentResponse = await fetch('/api/weather/current')
      const currentData = await currentResponse.json()
      
      if (forecastData.success && forecastData.data.daily) {
        const today = forecastData.data.daily
        setWeatherData({
          temperature_2m_max: today.temperature_2m_max[0],
          temperature_2m_min: today.temperature_2m_min[0],
          precipitation_sum: today.precipitation_sum[0],
          weather_code: today.weather_code[0],
          time: today.time[0],
          is_expanded: currentData.success ? currentData.data.is_expanded : false
        })
      }
    } catch (error) {
      console.error('Fehler beim Laden der Wetterdaten:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    )
  }

  if (!selectedImage || imageError) {
    return <div className="min-h-screen bg-black" />
  }

  const formattedDate = currentDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedTime = currentDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // 4K-optimierte Bild-URL
  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${selectedImage.bucket_name}/${selectedImage.storage_path}?width=3840&height=2160&resize=contain`

  return (
    <div className="relative min-h-screen bg-black">
      <Image
        src={imageUrl}
        alt={selectedImage.file_name}
        fill
        className="object-contain"
        onError={() => setImageError(true)}
        priority
        quality={100}
        sizes="100vw"
        unoptimized
      />
      
      {/* Wetter-Kachel */}
      {!weatherData?.is_expanded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 backdrop-blur-sm p-8 rounded-lg text-white w-[30%] mx-4">
            <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
              Das Wetter heute in Hohenmölsen
            </h1>
            <p className="text-xl text-center text-gray-300 mb-8">
              am {formattedDate} um {formattedTime}
            </p>
            
            {weatherData ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-base text-gray-400">Höchsttemperatur</p>
                  <p className="text-3xl font-bold">{weatherData.temperature_2m_max}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-base text-gray-400">Tiefsttemperatur</p>
                  <p className="text-3xl font-bold">{weatherData.temperature_2m_min}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-base text-gray-400">Niederschlag</p>
                  <p className="text-3xl font-bold">{weatherData.precipitation_sum} mm</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-xl">
                Lade Wetterdaten...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erweiterte Wetterkarte */}
      {weatherData?.is_expanded && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CurrentWeatherCard layout="double" isDarkMode={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 