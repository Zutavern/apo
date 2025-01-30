'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CurrentWeatherCard } from '@/app/dashboard/weather/components/cards/CurrentWeatherCard'

interface WeatherBackground {
  id: string
  file_name: string
  bucket_name: string
  storage_path: string
  created_at: string
  is_selected: boolean
}

export default function WeatherPortrait() {
  const supabase = createClientComponentClient()
  const [selectedImage, setSelectedImage] = useState<WeatherBackground | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    loadSelectedImage()
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

  // 4K-optimierte Bild-URL
  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${selectedImage.bucket_name}/${selectedImage.storage_path}?width=2160&height=3840&resize=contain`

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
      
      {/* Wetterkarte */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-2 gap-6">
            <CurrentWeatherCard layout="double" isDarkMode={false} />
          </div>
        </div>
      </div>
    </div>
  )
} 
