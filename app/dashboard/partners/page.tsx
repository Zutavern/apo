'use client'

import { useState } from 'react'
import { Handshake } from 'lucide-react'

export default function PartnersPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Handshake className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-100">Werbepartner</h1>
      </div>

      <div className="grid gap-6">
        {/* Hier kommt der Content */}
        <div className="text-center py-12 text-gray-400">
          Werbepartner-Verwaltung in Entwicklung
        </div>
      </div>
    </div>
  )
} 