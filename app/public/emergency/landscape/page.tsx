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
            Aktuelle Notdienste in Hohenmölsen am {new Date().toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {pharmacies.slice(0, 8).map((pharmacy, index) => (
              <div 
                key={pharmacy.id} 
                className="pharmacy-card bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-4 sm:p-6 h-[280px] w-full shadow-lg"
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
        </div>
      </div>
    </div>
  )
} 
