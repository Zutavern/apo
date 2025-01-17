'use client'

import { useState } from 'react'
import { 
  Monitor, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Play,
  Signal,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Plus
} from 'lucide-react'

export default function DigitalSignagePage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-semibold mb-4 px-4">Digital Signage</h1>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header mit Aktionsbutton */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-400">
              Verwalten Sie hier Ihre Digital Signage Displays und Inhalte
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus className="h-5 w-5 text-white" />
            <span>Neues Display</span>
          </button>
        </div>

        {/* Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Display Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium text-gray-900">Display 1</h3>
                  <p className="text-sm text-gray-500">Eingang</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Status:</span>
                  <span className="font-medium">Aktiv</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Letzte Aktualisierung:</span>
                  <span className="font-medium">Vor 5 Minuten</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktuelle Playlist:</span>
                  <span className="font-medium">Standard</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">
                  Bearbeiten
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Weiteres Display */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium text-gray-900">Display 2</h3>
                  <p className="text-sm text-gray-500">Wartezimmer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Wartung
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Status:</span>
                  <span className="font-medium">Wartung</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Letzte Aktualisierung:</span>
                  <span className="font-medium">Vor 2 Stunden</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktuelle Playlist:</span>
                  <span className="font-medium">Wartezimmer</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">
                  Bearbeiten
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 