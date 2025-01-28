'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

interface EmergencyBackground {
  id: string
  bucket_name: string
  storage_path: string
  file_name: string
  orientation: 'portrait' | 'landscape'
  is_selected: boolean
}

interface Pharmacy {
  id: string
  name: string
  address: {
    street: string
    postalCode: string
    city: string
  }
  phone: string
  distance: string
  emergencyServiceText: string
  qrCode: string
}

export default function EmergencyLandscape() {
  const [selectedImage, setSelectedImage] = useState<EmergencyBackground | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false)
  const [animatingRow, setAnimatingRow] = useState<number | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    Promise.all([
      loadSelectedImage(),
      loadPharmacies()
    ]).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    // Start auto-scroll nach 15 Sekunden
    const timer = setTimeout(() => {
      setAutoScrollEnabled(true)
    }, 15000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!autoScrollEnabled || pharmacies.length <= 4) return

    const animateRow = (row: number) => {
      setAnimatingRow(row)
      setTimeout(() => {
        if (row === 1) { // Wenn die zweite Reihe fertig ist, aktualisiere den Index
          setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex + 4
            return nextIndex >= pharmacies.length ? 0 : nextIndex
          })
        }
        setAnimatingRow(null)
      }, 1000)
    }

    const interval = setInterval(() => {
      // Animiere zuerst die untere Reihe
      animateRow(1)
      // Nach 1.5 Sekunden die obere Reihe
      setTimeout(() => animateRow(0), 1500)
    }, 15000)

    return () => clearInterval(interval)
  }, [autoScrollEnabled, pharmacies.length])

  // Hilfsfunktion um die Apotheken für eine Reihe zu bekommen
  const getPharmaciesForRow = (rowIndex: number) => {
    const startIndex = rowIndex === 0 ? currentIndex : (currentIndex + 4) % pharmacies.length
    const rowPharmacies = pharmacies.slice(startIndex, startIndex + 4)
    
    // Wenn nicht genug Apotheken für die Reihe da sind, fülle mit Apotheken vom Anfang auf
    if (rowPharmacies.length < 4) {
      return [...rowPharmacies, ...pharmacies.slice(0, 4 - rowPharmacies.length)]
    }
    
    return rowPharmacies
  }

  async function loadSelectedImage() {
    try {
      const { data, error } = await supabase
        .from('emergency_backgrounds')
        .select()
        .eq('orientation', 'landscape')
        .eq('is_selected', true)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setSelectedImage(data)
    } catch (error) {
      console.error('Fehler beim Laden des Hintergrundbildes:', error)
      setImageError(true)
    }
  }

  async function loadPharmacies() {
    try {
      const response = await fetch('/api/emergency', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        console.error('API-Fehler:', response.status, response.statusText)
        throw new Error('Netzwerkfehler')
      }
      
      const data = await response.json()
      if (!data.pharmacies) {
        console.error('Keine Apotheken-Daten in der Antwort')
        throw new Error('Ungültige Daten')
      }
      
      setPharmacies(data.pharmacies)
    } catch (error) {
      console.error('Fehler beim Laden der Apotheken:', error)
      setPharmacies([])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    )
  }

  const imageUrl = selectedImage 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${selectedImage.bucket_name}/${selectedImage.storage_path}`
    : null

  return (
    <div className="relative min-h-screen bg-black">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={selectedImage.file_name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          priority
          quality={100}
          sizes="100vw"
          unoptimized
        />
      )}

      <div className="absolute inset-0 flex items-start justify-center">
        <div className="w-[90%] max-w-[2000px] mx-auto" style={{ marginTop: '8vh' }}>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-black mb-6 xl:mb-8">
            Aktuelle Notdienste in der Umgebung von Hohenmölsen am {new Date().toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </h1>
          <div className="grid grid-cols-1 gap-4 mb-6">
            {[0, 1].map((row) => (
              <div key={row} className="grid grid-cols-4 gap-4">
                {getPharmaciesForRow(row).map((pharmacy, index) => (
                  <div 
                    key={`${pharmacy.id}-${row}-${index}`}
                    className={`pharmacy-card bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-4 sm:p-6 h-[280px] w-full shadow-lg transition-opacity duration-1000 ${
                      animatingRow === row ? 'opacity-0' : 'opacity-100'
                    }`}
                    data-index={index}
                  >
                    <div className="flex gap-4 h-[100px]">
                      <div className="bg-gray-100 p-2 rounded-lg w-[80px] h-[80px] flex items-center justify-center shrink-0 shadow-sm">
                        <div 
                          dangerouslySetInnerHTML={{ __html: pharmacy.qrCode }} 
                          className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                        />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{pharmacy.name}</h3>
                        <p className="text-xs text-gray-600">
                          {pharmacy.address.street}<br />
                          {pharmacy.address.postalCode} {pharmacy.address.city}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="text-gray-500">Telefon:</span> {pharmacy.phone}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 h-[80px] overflow-hidden">
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-500">Notdienstinfo:</span><br />
                        {pharmacy.emergencyServiceText}
                      </p>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {pharmacy.distance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="text-xl sm:text-2xl font-medium text-black text-right">
            Es haben gerade {pharmacies.length} Apotheken innerhalb von 25 km geöffnet.
          </div>
        </div>
      </div>
    </div>
  )
} 
