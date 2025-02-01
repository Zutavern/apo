'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Activity, Pill, Newspaper, LayoutGrid, Columns, Rows } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [notdienstCount, setNotdienstCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)
  const [lastNewsUpdate, setLastNewsUpdate] = useState<string | null>(null)
  const [layoutType, setLayoutType] = useState<'single' | 'double' | 'triple'>('triple')
  const [currentPharmacyCount, setCurrentPharmacyCount] = useState(0)
  const [lastPharmacyUpdate, setLastPharmacyUpdate] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.push('/')
          return
        }

        // Lade aktuelle Apotheken-Daten
        const { count: pharmacies } = await supabase
          .from('current_pharmacy_data')
          .select('*', { count: 'exact', head: true })

        // Hole das letzte Update-Datum
        const { data: latestPharmacy } = await supabase
          .from('current_pharmacy_data')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)

        // Lade Statistiken
        const { count: notdienste } = await supabase
          .from('apotheken_notdienst')
          .select('*', { count: 'exact', head: true })

        const { count: users } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // News Statistiken laden
        const { count: news } = await supabase
          .from('news')
          .select('*', { count: 'exact', head: true })

        const { data: latestNews } = await supabase
          .from('news')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)

        // Debugging-Ausgabe hinzufügen
        console.log('Latest Pharmacy Update:', latestPharmacy)

        setCurrentPharmacyCount(pharmacies || 0)
        setLastPharmacyUpdate(latestPharmacy?.[0]?.created_at || null)
        setNotdienstCount(notdienste || 0)
        setUserCount(users || 0)
        setNewsCount(news || 0)
        setLastNewsUpdate(latestNews?.[0]?.created_at || null)
        setIsLoading(false)
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error)
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="w-5 h-5" />
      case 'double':
        return <Columns className="w-5 h-5" />
      case 'triple':
        return <LayoutGrid className="w-5 h-5" />
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
        return 'flex flex-col gap-6'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-6 animate-pulse">
              <div className="h-6 w-24 bg-gray-700 rounded mb-6"></div>
              <div className="h-16 w-full bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Willkommen im Dashboard</h1>
        <button
          onClick={handleLayoutToggle}
          className="inline-flex items-center justify-center gap-2 rounded-md h-10 px-4 py-2 bg-gray-900/50 border border-white/10 hover:bg-gray-900/70 transition-colors text-gray-300"
          title={`Layout ändern (${getLayoutText()})`}
        >
          {getLayoutIcon()}
          <span className="hidden sm:inline">{getLayoutText()}</span>
        </button>
      </div>
      
      <div className={getGridClass()}>
        {/* Aktualisierte Notdienst-Kachel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-100">Notdienste</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <dt className="text-sm text-gray-400">Aktuelle Notdienst-Apotheken</dt>
                <dd className="mt-2 text-3xl font-semibold text-blue-500">
                  {currentPharmacyCount}
                </dd>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <dt className="text-sm text-gray-400">Letztes Update</dt>
                <dd className="mt-2 text-sm text-gray-300">
                  {lastPharmacyUpdate 
                    ? new Date(lastPharmacyUpdate).toLocaleString('de-DE')
                    : 'Kein Update-Datum verfügbar'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* News-Kachel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-100">News</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <dt className="text-sm text-gray-400">Gespeicherte Artikel</dt>
                <dd className="mt-2 text-3xl font-semibold text-blue-500">
                  {newsCount}
                </dd>
              </div>
              {lastNewsUpdate && (
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <dt className="text-sm text-gray-400">Letztes Update</dt>
                  <dd className="mt-2 text-sm text-gray-300">
                    {new Date(lastNewsUpdate).toLocaleString('de-DE')}
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benutzer-Kachel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-100">Benutzer</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <dt className="text-sm text-gray-400">Registrierte Benutzer</dt>
                <dd className="mt-2 text-3xl font-semibold text-blue-500">
                  {userCount}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* System-Status-Kachel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-100">System-Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-300">System aktiv</span>
              </div>
              <div className="flex items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-300">Datenbank verbunden</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 