'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function PublicOffersPortrait() {
  const [background, setBackground] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadBackground() {
      try {
        console.log('Loading portrait background...')
        const { data, error } = await supabase
          .from('offer_backgrounds')
          .select('*')
          .eq('orientation', 'portrait')
          .eq('is_selected', true)
          .single()

        console.log('Query result:', { data, error })

        if (error) throw error

        if (data) {
          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bg_offers-pt/${data.storage_path}`
          console.log('Generated URL:', imageUrl)
          // Test if image is accessible
          fetch(imageUrl)
            .then(res => console.log('Image fetch status:', res.status))
            .catch(err => console.error('Image fetch error:', err))
          setBackground(imageUrl)
        }
      } catch (error) {
        console.error('Fehler beim Laden des Hintergrunds:', error)
      }
    }

    loadBackground()
    const interval = setInterval(loadBackground, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!background) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    )
  }

  return (
    <div 
      className="w-screen h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${background})` }}
    />
  )
} 