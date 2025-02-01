'use client'

import { useState } from 'react'
import { RefreshCw, Image as ImageIcon, Monitor, Table2, LayoutGrid, Columns, Rows } from 'lucide-react'
import Link from 'next/link'

type LayoutType = 'table' | 'single' | 'double' | 'triple'

export default function OffersPage() {
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'table') return 'single'
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'table'
    })
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'table': return <Table2 className="h-5 w-5" />
      case 'single': return <Rows className="h-5 w-5" />
      case 'double': return <Columns className="h-5 w-5" />
      case 'triple': return <LayoutGrid className="h-5 w-5" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'table': return 'Tabelle'
      case 'single': return '1 Spalte'
      case 'double': return '2 Spalten'
      case 'triple': return '3 Spalten'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-2">
        <h1 className="text-2xl font-bold text-gray-100">Angebote</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <Link href="/dashboard/offers/backgrounds">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
              <ImageIcon className="h-5 w-5 text-purple-500" />
            </button>
          </Link>
          <Link href="/public/offers/portrait">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Portrait</span>
            </button>
          </Link>
          <Link href="/public/offers/landscape">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Landscape</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Hier kommt der Content */}
      <div className="text-center py-12 text-gray-400">
        Angebote-Verwaltung in Entwicklung
      </div>
    </div>
  )
} 