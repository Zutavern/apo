'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-100">Einstellungen</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Benutzer Einstellungen */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-100">Benutzerverwaltung</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">Benutzer hinzufügen, bearbeiten oder entfernen</p>
            <button 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              onClick={() => router.push('/dashboard/admin')}
            >
              Benutzer verwalten
            </button>
          </div>
        </div>

        {/* Weitere Einstellungs-Karten hier... */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-100">System</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">Grundlegende Systemeinstellungen verwalten</p>
            <button 
              className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm"
              onClick={() => {}}
            >
              Einstellungen öffnen
            </button>
          </div>
        </div>

        {/* Platz für weitere Karten */}
      </div>
    </div>
  )
} 