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

type News = {
  id: string
  title: string
  description: string | null
  url: string
  image: string | null
  source: string
  category: string
  published_at: string
  copy?: boolean
}

export default function NewsPortrait() {
  const [selectedImage, setSelectedImage] = useState<NewsBackground | null>(null)
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [offset, setOffset] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const supabase = createClientComponentClient()

  const loadMoreNews = async () => {
    const newOffset = offset + 4
    console.log('Portrait: Lade weitere News ab Position:', newOffset)
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .range(newOffset, newOffset + 3)

      if (newsError) {
        console.error('Portrait: Fehler beim Laden weiterer News:', newsError)
        return
      }

      // Wenn keine weiteren News verfügbar sind, von vorne beginnen
      if (!newsData || newsData.length === 0) {
        console.log('Portrait: Keine weiteren News verfügbar, beginne von vorne')
        const { data: resetData, error: resetError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .range(0, 3)

        if (!resetError && resetData) {
          setNews([...news.slice(0, -4), ...resetData])
          setOffset(0)
        }
        return
      }

      // Ansonsten die neuen News hinzufügen
      setNews([...news, ...newsData])
      setOffset(newOffset)
    } catch (error) {
      console.error('Portrait: Fehler beim Laden weiterer News:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      console.log('Portrait: Starte Datenladen...')
      try {
        // Lade das ausgewählte Hintergrundbild aus dem news_backgrounds Bucket
        console.log('Portrait: Lade Hintergrundbild...')
        const { data: bgData, error: bgError } = await supabase
          .from('news_backgrounds')
          .select('*')
          .eq('orientation', 'portrait')
          .eq('is_selected', true)
          .single()

        if (bgError) {
          console.error('Portrait: Fehler beim Laden des Hintergrundbildes:', bgError)
          throw bgError
        }
        
        console.log('Portrait: Hintergrundbild geladen:', bgData)
        setSelectedImage(bgData)

        // Lade die neuesten 4 News aus der news Tabelle
        console.log('Portrait: Lade News...')
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(4)

        if (newsError) {
          console.error('Portrait: Fehler beim Laden der News:', newsError)
          throw newsError
        }

        console.log('Portrait: News geladen:', newsData?.length || 0, 'Einträge')
        setNews(newsData || [])
      } catch (error) {
        console.error('Portrait: Allgemeiner Fehler beim Laden der Daten:', error)
        setImageError(true)
      } finally {
        setIsLoading(false)
        console.log('Portrait: Laden abgeschlossen')
      }
    }

    // Daten alle 5 Minuten neu laden
    loadData()
    const interval = setInterval(() => {
      console.log('Portrait: Starte periodisches Neuladen...')
      loadData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true)
    }, 2200)
    return () => clearTimeout(timer)
  }, [])

  // Automatisches Laden neuer Karten alle 30 Sekunden
  useEffect(() => {
    if (!isLoading) {
      const autoLoadTimer = setInterval(() => {
        console.log('Portrait: Automatisches Laden neuer Karten...')
        loadMoreNews()
      }, 30000)
      return () => clearInterval(autoLoadTimer)
    }
  }, [isLoading])

  if (isLoading) {
    console.log('Portrait: Zeige Ladeanzeige')
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    )
  }

  // 4K-optimierte Bild-URL für den Hintergrund aus dem Supabase Bucket
  const imageUrl = selectedImage 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${selectedImage.bucket_name}/${selectedImage.storage_path}`
    : ''

  console.log('Portrait: Render mit Bild-URL:', imageUrl)

  return (
    <div className="relative min-h-screen bg-black">
      {/* Hintergrundbild */}
      {selectedImage && !imageError && (
        <Image
          src={imageUrl}
          alt={selectedImage.file_name}
          fill
          className="object-contain"
          onError={(e) => {
            console.error('Portrait: Fehler beim Laden des Hintergrundbildes:', imageUrl)
            setImageError(true)
          }}
          priority
          quality={100}
          sizes="100vw"
          unoptimized
        />
      )}

      {/* News Grid */}
      <div className="relative z-10 max-w-4xl mx-auto py-4 px-3 h-screen scale-[0.7] origin-top">
        <h2 className="text-3xl font-bold text-white mb-2">Interessante News</h2>
        <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[calc(100vh-2rem)] pt-[50px]">
          {news.slice(offset, offset + 4).map((item, index) => (
            <div
              key={item.id}
              className={`bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-all h-full flex flex-col opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] ${
                index === 0 ? 'animation-delay-[0.2s]' :
                index === 1 ? 'animation-delay-[0.7s]' :
                index === 2 ? 'animation-delay-[1.2s]' :
                'animation-delay-[1.7s]'
              }`}
            >
              {item.image && (
                <div className="w-full h-[45%] relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Portrait: Fehler beim Laden des News-Bildes:', item.image)
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1.5">
                  <span className="px-1.5 py-0.5 bg-gray-700 rounded">
                    {item.source}
                  </span>
                  <span className="text-xs">
                    {new Date(item.published_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </span>
                </div>
                <h3 className="font-medium text-base mb-1.5 line-clamp-3 text-gray-100 flex-grow">
                  {item.title}
                </h3>
                <p className="text-sm line-clamp-4 text-gray-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <div className="relative w-1/2">
            <button
              onClick={loadMoreNews}
              className={`px-12 py-4 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-2xl w-full transition-all relative shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(37,99,235,0.8)] animate-[popIn_0.5s_ease-out_forwards] ${
                showButton ? 'opacity-100' : 'opacity-0 scale-0'
              }`}
            >
              Weitere News
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes popIn {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        .animation-delay-\[0\.2s\] { animation-delay: 0.2s; }
        .animation-delay-\[0\.7s\] { animation-delay: 0.7s; }
        .animation-delay-\[1\.2s\] { animation-delay: 1.2s; }
        .animation-delay-\[1\.7s\] { animation-delay: 1.7s; }
      `}</style>
    </div>
  )
} 