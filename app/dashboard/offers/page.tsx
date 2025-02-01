'use client'

import { useState } from 'react'
import { Tag } from 'lucide-react'

export default function OffersPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Tag className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-100">Angebotskonfiguration</h1>
      </div>

      {/* Content */}
      <div className="grid gap-6">
        {/* Hier kommt der weitere Inhalt */}
      </div>
    </div>
  )
} 