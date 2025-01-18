'use client'

import { useRouter } from 'next/navigation'
import { Newspaper } from 'lucide-react'

export default function NewsPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-100 mb-8">Nachrichten</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => router.push('/dashboard/news/api')}
          className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors text-left"
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Nachrichten aus APIs</h3>
            <p className="text-sm text-gray-400">
              Nachrichten von verschiedenen Quellen wie Deutsche Welle, Focus, Tagesschau und mehr.
            </p>
          </div>
        </button>

        {/* Hier können später weitere Karten für andere Nachrichtenquellen hinzugefügt werden */}
      </div>
    </div>
  )
} 