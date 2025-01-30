'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CurrentWeatherCard } from '@/app/dashboard/weather/components/cards/CurrentWeatherCard'
import { motion } from 'framer-motion'

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
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadSelectedImage()
    // Verzögere die Anzeige der Karte um einen kurzen Moment für einen schönen Effekt
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
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
      
      {/* Wetterkarte mit Animation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 20 
        }}
        transition={{ 
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-2 gap-6">
            <CurrentWeatherCard layout="double" isDarkMode={false} />
          </div>
        </div>
      </motion.div>
    </div>
  )
} 
