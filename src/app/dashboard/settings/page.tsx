'use client'

import { Metadata } from 'next'
import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Einstellungen | Dashboard',
  description: 'Verwalten Sie Ihre Systemeinstellungen',
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-100">Einstellungen</h1>
      </div>

      <div className="grid gap-6">
        {/* System Einstellungen */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">System Einstellungen</h2>
            <div className="space-y-6">
              {/* Benachrichtigungen */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-sm font-medium text-gray-100">Benachrichtigungen</h3>
                  <p className="text-sm text-gray-400">Email-Benachrichtigungen bei wichtigen Ereignissen</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Darkmode */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-sm font-medium text-gray-100">Dark Mode</h3>
                  <p className="text-sm text-gray-400">Dunkles Erscheinungsbild der Benutzeroberfläche</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* API Einstellungen */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-sm font-medium text-gray-100">API Schlüssel</h3>
                  <p className="text-sm text-gray-400">Verwalten Sie Ihre API-Zugangsdaten</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benutzer Einstellungen */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Benutzer Einstellungen</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-sm font-medium text-gray-100">Profil</h3>
                  <p className="text-sm text-gray-400">Bearbeiten Sie Ihre Profilinformationen</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 