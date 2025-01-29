'use client'

import { ArrowLeft, RefreshCw, Rows, Columns, LayoutGrid, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CurrentWeatherCard } from '../components/cards/CurrentWeatherCard'
import { ForecastCard } from '../components/cards/ForecastCard'
import { PollenCard } from '../components/cards/PollenCard'
import { UVIndexCard } from '../components/cards/UVIndexCard'
import { BioweatherCard } from '../components/cards/BioweatherCard'
import { AsthmaIndexCard } from '../components/cards/AsthmaIndexCard'

type LayoutType = 'single' | 'double' | 'triple'

export default function WeatherApiPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [layout, setLayout] = useState<LayoutType>('single')
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/weather/update')
      if (!response.ok) {
        throw new Error('Update fehlgeschlagen')
      }
      // Erfolgreich aktualisiert
      window.location.reload()
    } catch (error) {
      console.error('Fehler beim Update:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutToggle = () => {
    setLayout(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layout) {
      case 'single':
        return <Rows className="h-5 w-5 text-blue-500" />
      case 'double':
        return <Columns className="h-5 w-5 text-blue-500" />
      case 'triple':
        return <LayoutGrid className="h-5 w-5 text-blue-500" />
    }
  }

  const getLayoutText = () => {
    switch (layout) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  const getGridClass = () => {
    switch (layout) {
      case 'single':
        return 'grid gap-6 grid-cols-1'
      case 'double':
        return 'grid gap-6 grid-cols-1 md:grid-cols-2'
      case 'triple':
        return 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return 'grid gap-6 grid-cols-1'
    }
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/weather"
          className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Wetter API</h1>
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
            title={isDarkMode ? 'Tag-Modus' : 'Nacht-Modus'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-purple-500" />
            )}
          </button>
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Neue Daten abrufen"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className={getGridClass()}>
        <CurrentWeatherCard layout={layout} isDarkMode={isDarkMode} />
        <ForecastCard layout={layout} isDarkMode={isDarkMode} />
        <PollenCard layout={layout} isDarkMode={isDarkMode} />
        <UVIndexCard layout={layout} isDarkMode={isDarkMode} />
        <BioweatherCard layout={layout} isDarkMode={isDarkMode} />
        <AsthmaIndexCard layout={layout} isDarkMode={isDarkMode} />
      </div>
    </div>
  )
} 
