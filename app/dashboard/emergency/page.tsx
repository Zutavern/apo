'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from 'next/link'
import { LayoutGrid, Columns, Rows, ChevronLeft, ChevronRight, Image, Monitor, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

type LayoutType = 'single' | 'double' | 'triple'

export default function EmergencyPage() {
  const supabase = createClientComponentClient()
  const [message, setMessage] = useState('')
  const [apotheken, setApotheken] = useState<Apotheke[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')
  const [currentPage, setCurrentPage] = useState(1)
  const heute = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      setMessage('')
      
      const { data, error } = await supabase
        .from('apotheken_notdienst')
        .select('*')
        .order('entfernung', { ascending: true })
      
      if (error) throw error
      setApotheken(data || [])
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren:', error)
      setMessage(`Fehler beim Aktualisieren der Daten: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getItemsPerPage = () => {
    switch (layoutType) {
      case 'single':
        return 3
      case 'double':
        return 6
      case 'triple':
        return 6
      default:
        return 6
    }
  }

  const totalPages = Math.ceil(apotheken.length / getItemsPerPage())
  const itemsPerPage = getItemsPerPage()
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentApotheken = apotheken.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  useEffect(() => {
    async function fetchApotheken() {
      try {
        console.log('Starte Apotheken-Abruf...')
        setIsLoading(true)
        setMessage('')
        
        const query = supabase
          .from('apotheken_notdienst')
          .select('*')
          .order('entfernung', { ascending: true })
        
        console.log('Supabase Query:', query)
        
        const { data, error } = await query
        
        if (error) {
          console.error('Supabase Fehler:', error)
          throw error
        }
        
        console.log('Rohdaten von Supabase:', data)
        if (data && data.length > 0) {
          console.log('Beispiel-Apotheke:', {
            name: data[0].apothekenname,
            telefon: data[0].telefon,
            entfernung: data[0].entfernung,
            alleFelder: JSON.stringify(data[0], null, 2)
          })
          
          console.log('Datentypen:', {
            telefon: typeof data[0].telefon,
            entfernung: typeof data[0].entfernung,
            allKeys: Object.keys(data[0])
          })
        } else {
          console.log('Keine Apotheken gefunden')
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

  useEffect(() => {
    // Reset to first page when layout changes
    setCurrentPage(1)
  }, [layoutType])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Skeleton className="w-[600px] h-32" />
      </div>
    )
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="h-5 w-5 text-blue-500" />
      case 'double':
        return <Columns className="h-5 w-5 text-blue-500" />
      case 'triple':
        return <LayoutGrid className="h-5 w-5 text-blue-500" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'single':
        return 'grid grid-cols-1 gap-6'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Notdienst-Verwaltung</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            title="Layout ändern"
          >
            {getLayoutIcon()}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Daten aktualisieren"
          >
            <RefreshCw className={`h-5 w-5 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="/dashboard/emergency/backgrounds"
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
          >
            <Image className="h-5 w-5 text-purple-500" />
          </a>
          <a
            href="/emergency/portrait"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
          >
            <Monitor className="h-5 w-5 text-green-500" />
            <span>Portrait</span>
          </a>
          <a
            href="/emergency/landscape"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
          >
            <Monitor className="h-5 w-5 text-green-500" />
            <span>Landscape</span>
          </a>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">
            Apotheken Notdienste - {heute}
          </h2>
        </div>

        {message && (
          <div className="mb-8 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            {message}
          </div>
        )}

        <div className={getGridClass()}>
          {apotheken.length === 0 ? (
            <Card className="bg-gray-900/50 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <p className="text-lg text-gray-400 text-center">
                  Keine Notdienst-Apotheken für heute verfügbar
                </p>
              </CardContent>
            </Card>
          ) : (
            currentApotheken.map((apotheke) => (
              <Card key={apotheke.id} className="bg-gray-900/50 border-white/10 backdrop-blur-sm hover:bg-gray-900/70 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="grid sm:grid-cols-[1fr,auto] gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <h3 className="font-bold text-lg sm:text-xl text-white line-clamp-1">
                          {apotheke.apothekenname}
                        </h3>
                        <Link 
                          href={`/dashboard/emergency/edit/${apotheke.id}`}
                          className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
                          title="Apotheke bearbeiten"
                        >
                          <svg 
                            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500 transition-colors" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                      </div>
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <div className="text-sm sm:text-base text-gray-300 space-y-1">
                          <p className="line-clamp-1">{apotheke.strasse}</p>
                          <p className="line-clamp-1">{apotheke.plz} {apotheke.ort}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <p className="text-sm sm:text-base text-gray-300">{apotheke.telefon}</p>
                      </div>
                    </div>
                    <div className="flex items-start justify-end">
                      <div className="text-right">
                        <p className={`${layoutType === 'triple' ? 'text-sm lg:text-base' : 'text-base sm:text-lg'} font-semibold text-white`}>{apotheke.entfernung}</p>
                      </div>
                    </div>
                  </div>
                  {apotheke.notdiensttext && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                      <p className="text-sm sm:text-base text-gray-300">{apotheke.notdiensttext}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md h-10 px-4 py-2 bg-gray-900/50 border border-white/10 hover:bg-gray-900/70 transition-colors text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-gray-300">
              Seite {currentPage} von {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md h-10 px-4 py-2 bg-gray-900/50 border border-white/10 hover:bg-gray-900/70 transition-colors text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 