'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function PublicOffersPortrait() {
  const [background, setBackground] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadBackground() {
      try {
        const { data, error } = await supabase
          .from('offer_backgrounds')
          .select('*')
          .eq('orientation', 'portrait')
          .eq('is_selected', true)
          .single()

        if (error) throw error

        if (data) {
          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.bucket_name}/${data.storage_path}`
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