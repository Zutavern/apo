'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function WeatherUpdate() {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      setUpdateStatus('loading')
      
      const response = await fetch('/api/weather/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Wetterdaten')
      }

      setUpdateStatus('success')
      setTimeout(() => {
        router.push('/dashboard/weather')
      }, 1500)
    } catch (error) {
      console.error('Update Fehler:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setUpdateStatus('error')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Wetterdaten aktualisieren</h1>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Hier können Sie die Wetterdaten manuell aktualisieren. Dies wird die neuesten Daten von unserem Wetterdienst abrufen.
            </p>

            <div className="flex justify-center py-6">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg
                  ${updateStatus === 'loading' ? 'bg-gray-400' :
                    updateStatus === 'success' ? 'bg-green-500' :
                    updateStatus === 'error' ? 'bg-red-500' :
                    'bg-blue-500 hover:bg-blue-600'}
                  text-white transition-colors
                `}
              >
                {updateStatus === 'loading' ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Aktualisiere...
                  </>
                ) : updateStatus === 'success' ? (
                  'Erfolgreich aktualisiert!'
                ) : updateStatus === 'error' ? (
                  'Fehler bei der Aktualisierung'
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Jetzt aktualisieren
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                {errorMessage}
              </div>
            )}

            {updateStatus === 'success' && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg">
                Die Wetterdaten wurden erfolgreich aktualisiert. Sie werden in Kürze zurück zum Dashboard geleitet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 