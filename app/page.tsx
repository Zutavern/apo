'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Lock, User } from 'lucide-react'

export default function Home() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Ungültige Anmeldedaten')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-xl max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <LogIn className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Anmelden</h1>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
            <p>{error}</p>
            <button
              onClick={() => router.push('/reset-password')}
              className="text-blue-500 hover:text-blue-400 text-sm mt-2"
            >
              Passwort zurücksetzen?
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Benutzername
              </div>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Passwort
              </div>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Anmelden
          </button>
        </form>
      </div>
    </div>
  )
}
