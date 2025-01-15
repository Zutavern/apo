'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Activity, Pill } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [notdienstCount, setNotdienstCount] = useState(0)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.push('/')
          return
        }

        // Lade Statistiken
        const { count: notdienste } = await supabase
          .from('apotheken_notdienst')
          .select('*', { count: 'exact', head: true })

        const { count: users } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        setNotdienstCount(notdienste || 0)
        setUserCount(users || 0)
        setIsLoading(false)
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error)
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

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
      <h1 className="text-2xl font-bold text-gray-100 mb-8">Willkommen im Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Notdienst-Kachel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-100">Notdienste</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <dt className="text-sm text-gray-400">Aktuelle Notdienste</dt>
                <dd className="mt-2 text-3xl font-semibold text-blue-500">
                  {notdienstCount}
                </dd>
              </div>
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