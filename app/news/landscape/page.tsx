'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

type NewsBackground = {
  id: string
  created_at: string
  file_name: string
  bucket_name: string
  storage_path: string
  orientation: 'portrait' | 'landscape'
  is_selected: boolean
}

export default function NewsLandscape() {
  const [selectedImage, setSelectedImage] = useState<NewsBackground | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadSelectedImage = async () => {
      try {
        const { data, error } = await supabase
          .from('news_backgrounds')
          .select('*')
          .eq('orientation', 'landscape')
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

    loadSelectedImage()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    )
  }

  // Wenn kein Bild ausgewählt ist oder ein Fehler auftritt, zeige nur den schwarzen Hintergrund
  if (!selectedImage || imageError) {
    return <div className="min-h-screen bg-black" />
  }

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
    </div>
  )
} 