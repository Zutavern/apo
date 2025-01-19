'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Apotheke = {
  id: string
  apothekenname: string
  strasse: string
  plz: string
  ort: string
  telefon: string
  notdiensttext: string
  created_at: string
  entfernung: string
}

export default function PublicEmergencyPage() {
  const [message, setMessage] = useState('')
  const [apotheken, setApotheken] = useState<Apotheke[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const heute = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  useEffect(() => {
    async function fetchApotheken() {
      try {
        setIsLoading(true)
        setMessage('')
        const { data, error } = await supabase
          .from('apotheken_notdienst')
          .select('*')
          .order('entfernung', { ascending: true })
        
        if (error) {
          console.error('Supabase Fehler:', error)
          throw error
        }
        
        setApotheken(data || [])
      } catch (error: any) {
        console.error('Detaillierter Fehler:', error)
        setMessage(
          `Fehler beim Laden der Notdienst-Apotheken: ${error.message || 'Unbekannter Fehler'}`
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchApotheken()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Skeleton className="w-[600px] h-32" />
      </div>
    )
  }

  // Dupliziere die Apotheken für einen nahtlosen Loop
  const duplicatedApotheken = [...apotheken, ...apotheken]

  return (
    <div className="min-h-screen bg-black/95">
      <div className="max-w-7xl mx-auto relative overflow-hidden">
        <div className="sticky top-0 z-10 bg-black/95 pt-8 pb-6 backdrop-blur-sm border-b border-white/10">
          <h1 className="text-3xl font-bold px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            Apotheken Notdienste - {heute}
          </h1>
          {message && (
            <div className="mt-4 mx-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {message}
            </div>
          )}
        </div>

        <div 
          className="space-y-6 px-4 relative"
          style={{
            animation: 'scroll 120s linear infinite',
            maskImage: 'linear-gradient(to bottom, transparent, black 50px, black calc(100% - 50px), transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 50px, black calc(100% - 50px), transparent)'
          }}
        >
          {duplicatedApotheken.map((apotheke, index) => (
            <Card key={`${apotheke.id}-${index}`} className="transition-opacity duration-1000 bg-gray-900/50 border-white/10 backdrop-blur-sm hover:bg-gray-900/70">
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-[1fr,auto] gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <h3 className="font-bold text-xl text-white">
                        {apotheke.apothekenname}
                      </h3>
                    </div>
                    
                    <div className="pl-9 space-y-2">
                      <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="text-gray-300">{apotheke.strasse}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        <span className="text-gray-300">0{apotheke.plz} {apotheke.ort}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <span className="font-medium text-gray-300">{apotheke.telefon || 'Keine Telefonnummer verfügbar'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="min-w-[280px] flex flex-col justify-between">
                    <p className="text-right font-bold leading-relaxed text-gray-300">
                      {apotheke.notdiensttext}
                    </p>
                    <div className="flex items-start justify-end">
                      <div className="text-right flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                        <p className="text-base sm:text-lg font-semibold text-white">{apotheke.entfernung}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  )
} 