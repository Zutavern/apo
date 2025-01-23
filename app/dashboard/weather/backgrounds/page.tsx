import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WeatherBackgroundsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link 
          href="/dashboard/weather"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zum Wetter</span>
        </Link>
        <h1 className="text-2xl font-bold">Wetter-Hintergründe</h1>
        <p className="text-gray-400 mt-2">
          Wählen Sie einen Hintergrund für Ihre Wetteranzeige
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-medium mb-4">Wählen Sie Ihren Wetter-Hintergrund:</h2>
          {/* Hier kommen später die Auswahlmöglichkeiten */}
        </div>
      </div>
    </div>
  )
} 