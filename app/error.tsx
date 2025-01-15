'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Ein Fehler ist aufgetreten</h2>
        <button
          onClick={() => reset()}
          className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
} 