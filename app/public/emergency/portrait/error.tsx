'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Etwas ist schiefgelaufen!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  )
} 