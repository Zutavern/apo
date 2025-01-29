'use client'

import { useState } from 'react'
import { RefreshCw, Image as ImageIcon, Monitor, LayoutGrid, Columns, Rows } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type LayoutType = 'single' | 'double' | 'triple'

export default function WeatherDashboard() {
  const [layout, setLayout] = useState<LayoutType>('single')

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
        return 'grid grid-cols-1 gap-4'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      default:
        return 'grid grid-cols-1 gap-4'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-200">
            Wetter Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <Link href="/dashboard/weather/api">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </button>
          </Link>
          <Link href="/dashboard/weather/backgrounds">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
              <ImageIcon className="h-5 w-5 text-purple-500" />
            </button>
          </Link>
          <Link href="/wetter/portrait">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Portrait</span>
            </button>
          </Link>
          <Link href="/wetter/landscape">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Landscape</span>
            </button>
          </Link>
        </div>
      </div>

      <div className={getGridClass()}>
        {/* Hier werden wir die neuen Wetterkarten einfügen */}
      </div>
    </div>
  )
} 