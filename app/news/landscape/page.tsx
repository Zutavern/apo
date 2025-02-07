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

export default function NewsLandscape() {
  const [selectedImage, setSelectedImage] = useState<NewsBackground | null>(null)
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [offset, setOffset] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      console.log('Landscape: Starte Datenladen...')
      try {
        // Lade das ausgewählte Hintergrundbild aus dem news_backgrounds Bucket
        console.log('Landscape: Lade Hintergrundbild...')
        const { data: bgData, error: bgError } = await supabase
          .from('news_backgrounds')
          .select('*')
          .eq('orientation', 'landscape')
          .eq('is_selected', true)
          .single()

        if (bgError) {
          console.error('Landscape: Fehler beim Laden des Hintergrundbildes:', bgError)
          throw bgError
        }
        
        console.log('Landscape: Hintergrundbild geladen:', bgData)
        setSelectedImage(bgData)

        // Lade die neuesten 6 News aus der news Tabelle
        console.log('Landscape: Lade News...')
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(6)

        if (newsError) {
          console.error('Landscape: Fehler beim Laden der News:', newsError)
          throw newsError
        }

        console.log('Landscape: News geladen:', newsData?.length || 0, 'Einträge')
        setNews(newsData || [])
      } catch (error) {
        console.error('Landscape: Allgemeiner Fehler beim Laden der Daten:', error)
        setImageError(true)
      } finally {
        setIsLoading(false)
        console.log('Landscape: Laden abgeschlossen')
      }
    }

    // Daten alle 5 Minuten neu laden
    loadData()
    const interval = setInterval(() => {
      console.log('Landscape: Starte periodisches Neuladen...')
      loadData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadMoreNews = async () => {
    const newOffset = offset + 6
    console.log('Landscape: Lade weitere News ab Position:', newOffset)
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .range(newOffset, newOffset + 5)

      if (newsError) {
        console.error('Landscape: Fehler beim Laden weiterer News:', newsError)
        return
      }

      // Wenn keine weiteren News verfügbar sind oder weniger als 6, von vorne beginnen
      if (!newsData || newsData.length < 6) {
        console.log('Landscape: Keine weiteren News verfügbar oder weniger als 6, fülle mit News von vorne auf')
        const { data: resetData, error: resetError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(6)

        if (!resetError && resetData) {
          // Wenn es noch einige News gab, diese mit den ersten News auffüllen
          if (newsData && newsData.length > 0) {
            const remainingCount = 6 - newsData.length
            const combinedNews = [...newsData, ...resetData.slice(0, remainingCount)]
            setNews(combinedNews)
          } else {
            // Wenn keine News mehr da waren, komplett neue 6 laden
            setNews(resetData)
          }
          setOffset(0)
        }
        return
      }

      // Ansonsten die neuen 6 News setzen
      setNews(newsData)
      setOffset(newOffset)
    } catch (error) {
      console.error('Landscape: Fehler beim Laden weiterer News:', error)
    }
  }

  // Initial genau 6 News laden
  useEffect(() => {
    const loadInitialNews = async () => {
      console.log('Landscape: Lade initiale News...')
      try {
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(6)

        if (newsError) {
          console.error('Landscape: Fehler beim Laden der initialen News:', newsError)
          return
        }

        setNews(newsData || [])
      } catch (error) {
        console.error('Landscape: Fehler beim Laden der initialen News:', error)
      }
    }

    loadInitialNews()
  }, [])

  // Automatisches Laden neuer Karten alle 30 Sekunden
  useEffect(() => {
    if (!isLoading) {
      const autoLoadTimer = setInterval(() => {
        console.log('Landscape: Automatisches Laden neuer Karten...')
        loadMoreNews()
      }, 30000)
      return () => clearInterval(autoLoadTimer)
    }
  }, [isLoading])

  if (isLoading) {
    console.log('Landscape: Zeige Ladeanzeige')
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

  console.log('Landscape: Render mit Bild-URL:', imageUrl)

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Hintergrundbild */}
      {selectedImage && !imageError && (
        <Image
          src={imageUrl}
          alt={selectedImage.file_name}
          fill
          className="object-cover"
          onError={(e) => {
            console.error('Landscape: Fehler beim Laden des Hintergrundbildes:', imageUrl)
            setImageError(true)
          }}
          priority
          quality={100}
          sizes="100vw"
          unoptimized
        />
      )}

      {/* News Grid */}
      <div className="relative z-10 container mx-auto py-8 px-4 scale-[0.8] origin-top pt-[100px]">
        <h2 className="text-3xl font-bold text-white mb-8">Aktuelle News</h2>
        <div className="grid grid-cols-3 gap-4">
          {news.map((item, index) => (
            <div
              key={item.id}
              className={`bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors h-[450px] opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] ${
                index === 0 ? 'animation-delay-[0.2s]' :
                index === 1 ? 'animation-delay-[0.7s]' :
                index === 2 ? 'animation-delay-[1.2s]' :
                index === 3 ? 'animation-delay-[1.7s]' :
                index === 4 ? 'animation-delay-[2.2s]' :
                'animation-delay-[2.7s]'
              }`}
            >
              <div className="flex flex-col h-full">
                {item.image && (
                  <div className="w-full h-[250px] relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error('Landscape: Fehler beim Laden des News-Bildes:', item.image)
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                    <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                      {item.source}
                    </span>
                    <span className="text-xs">
                      {new Date(item.published_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className="font-medium text-base mb-2 text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
        .animation-delay-\[0\.2s\] { animation-delay: 0.2s; }
        .animation-delay-\[0\.7s\] { animation-delay: 0.7s; }
        .animation-delay-\[1\.2s\] { animation-delay: 1.2s; }
        .animation-delay-\[1\.7s\] { animation-delay: 1.7s; }
        .animation-delay-\[2\.2s\] { animation-delay: 2.2s; }
        .animation-delay-\[2\.7s\] { animation-delay: 2.7s; }
      `}</style>
    </div>
  )
} 