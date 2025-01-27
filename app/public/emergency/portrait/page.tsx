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

export default function EmergencyPortrait() {
  const [selectedImage, setSelectedImage] = useState<EmergencyBackground | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    Promise.all([
      loadSelectedImage(),
      loadPharmacies()
    ]).finally(() => setIsLoading(false))
  }, [])

  async function loadSelectedImage() {
    try {
      const { data, error } = await supabase
        .from('emergency_backgrounds')
        .select()
        .eq('orientation', 'portrait')
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 100vw"
        />
      )}

      <div className="relative z-10 container mx-auto p-4 sm:p-6 md:p-8 pb-[200px] min-h-screen flex flex-col">
        <div className="w-[120%] -translate-x-[10%] flex flex-col px-[calc(10%/2.4)]">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8">
            Aktuelle Notdienste in Hohenmölsen am {new Date().toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-2">
            {pharmacies.map((pharmacy, index) => (
              <div 
                key={pharmacy.id} 
                className="pharmacy-card bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 p-4 sm:p-6 h-fit"
                data-index={index}
              >
                <div className="flex gap-4 sm:gap-6">
                  <div className="bg-white p-2 rounded-lg w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] flex items-center justify-center shrink-0">
                    <div 
                      dangerouslySetInnerHTML={{ __html: pharmacy.qrCode }} 
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{pharmacy.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      {pharmacy.address.street}<br />
                      {pharmacy.address.postalCode} {pharmacy.address.city}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300">
                      <span className="text-gray-400">Telefon:</span> {pharmacy.phone}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-gray-300">
                    <span className="text-gray-400">Notdienstinfo:</span><br />
                    {pharmacy.emergencyServiceText}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 flex justify-end">
                  <span className="inline-block px-2 sm:px-3 py-1 bg-white/10 rounded-full text-xs sm:text-sm text-gray-300">
                    {pharmacy.distance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
