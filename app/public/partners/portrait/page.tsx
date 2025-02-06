'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

interface Partner {
  id: string
  company_name: string
  landscape_image?: string
  portrait_image?: string
}

export default function PartnerPortrait() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [viewStartTime, setViewStartTime] = useState<Date | null>(null)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [isTabActive, setIsTabActive] = useState(true)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const partnerId = searchParams.get('id')

  // Tab-Aktivität überwachen
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      setIsTabActive(isVisible)
      console.log('👁️ Tab-Status geändert:', { isVisible })
      
      // Sofortiges Update bei Statusänderung
      if (partnerId && viewStartTime && trackingId) {
        updateTrackingDuration(partnerId, viewStartTime, trackingId, false, isVisible)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [partnerId, viewStartTime, trackingId])

  // Regelmäßiges Update der Tracking-Dauer
  useEffect(() => {
    if (!partnerId || !viewStartTime || !trackingId) return

    console.log('⏱️ Starte Tracking-Updates...')
    
    // Sofort ersten Update durchführen
    updateTrackingDuration(partnerId, viewStartTime, trackingId, false, isTabActive)

    // Alle 5 Sekunden aktualisieren
    const interval = setInterval(() => {
      updateTrackingDuration(partnerId, viewStartTime, trackingId, false, isTabActive)
    }, 5000) // 5 Sekunden

    return () => {
      console.log('⏱️ Beende Tracking-Updates')
      clearInterval(interval)
      // Finaler Update beim Verlassen
      updateTrackingDuration(partnerId, viewStartTime, trackingId, true, isTabActive)
    }
  }, [partnerId, viewStartTime, trackingId, isTabActive])

  useEffect(() => {
    if (partnerId) {
      loadPartner(partnerId)
      // Tracking starten
      const startTime = new Date()
      setViewStartTime(startTime)
      
      // Tracking-Eintrag erstellen
      createTrackingEntry(partnerId, startTime)
    }
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => {
      clearTimeout(timer)
    }
  }, [partnerId])

  async function createTrackingEntry(id: string, startTime: Date) {
    try {
      console.log('🎯 Erstelle Tracking-Eintrag:', {
        partner_id: id,
        startTime: startTime.toISOString(),
        type: 'portrait'
      })

      const { data, error } = await supabase
        .from('partner_view_tracking')
        .insert([
          {
            partner_id: id,
            view_started_at: startTime.toISOString(),
            image_type: 'portrait',
            image_loaded: false,
            had_errors: false,
            tab_was_active: true,
            view_duration_seconds: 0
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('❌ Fehler beim Erstellen des Tracking-Eintrags:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
      } else if (data) {
        console.log('✅ Tracking-Eintrag erstellt:', {
          id: data.id,
          startTime: data.view_started_at
        })
        setTrackingId(data.id)
      }
    } catch (error) {
      console.error('❌ Unerwarteter Fehler beim Tracking:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  async function updateTrackingDuration(
    id: string, 
    startTime: Date, 
    trackingId: string, 
    isFinal: boolean = false,
    isActive: boolean = true
  ) {
    try {
      const now = new Date()
      const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000)
      
      console.log('⏱️ Update Tracking-Dauer:', {
        trackingId,
        durationSeconds,
        isFinal,
        isTabActive: isActive
      })

      const updateData: any = {
        view_duration_seconds: durationSeconds,
        image_loaded: !imageError,
        had_errors: imageError,
        tab_was_active: isActive
      }

      // Wenn final, dann auch End-Zeit setzen
      if (isFinal) {
        updateData.view_ended_at = now.toISOString()
      }

      const { error } = await supabase
        .from('partner_view_tracking')
        .update(updateData)
        .eq('id', trackingId)

      if (error) {
        console.error('❌ Fehler beim Aktualisieren der Tracking-Dauer:', {
          error: error.message,
          trackingId,
          durationSeconds,
          isTabActive: isActive
        })
      } else {
        console.log('✅ Tracking-Dauer aktualisiert:', {
          trackingId,
          durationSeconds,
          isFinal,
          isTabActive: isActive
        })
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Trackings:', error)
    }
  }

  async function loadPartner(id: string) {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .not('portrait_image', 'is', null)
        .single()

      if (error) throw error
      setPartner(data)
    } catch (error) {
      console.error('Fehler beim Laden des Partners:', error)
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

  if (!partner || imageError || !partner.portrait_image) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Image
        src={partner.portrait_image}
        alt={partner.company_name}
        fill
        className="object-contain"
        onError={() => {
          setImageError(true)
          // Fehler im Tracking vermerken
          if (viewStartTime && partnerId) {
            supabase
              .from('partner_view_tracking')
              .update({ had_errors: true })
              .eq('partner_id', partnerId)
              .eq('view_started_at', viewStartTime.toISOString())
          }
        }}
        priority
        quality={100}
        sizes="100vw"
        unoptimized
      />
    </div>
  )
} 