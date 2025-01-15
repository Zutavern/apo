'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import bcrypt from 'bcryptjs'

export default function ResetPassword() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Überprüfe, ob die E-Mail-Adresse existiert
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      console.log('Supabase Antwort:', { user, error })

      if (error || !user) {
        setMessage('Diese E-Mail-Adresse wurde nicht gefunden.')
        setIsLoading(false)
        return
      }

      // Generiere 4-stelligen Code
      const code = Math.floor(1000 + Math.random() * 9000).toString()
      console.log('Generierter Code:', code)

      // Speichere den Code in der Datenbank
      const { error: updateError } = await supabase
        .from('users')
        .update({ reset_code: code })
        .eq('email', email)

      console.log('Code-Update Ergebnis:', { updateError })

      if (updateError) throw updateError

      // Sende E-Mail mit dem Code
      const response = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          resetCode: code
        }),
      })

      const result = await response.json()
      console.log('E-Mail-Versand Ergebnis:', result)

      if (!response.ok) {
        throw new Error('Fehler beim Senden der E-Mail: ' + JSON.stringify(result))
      }

      setMessage('Ein Reset-Code wurde an Ihre E-Mail-Adresse gesendet.')
      setStep('code')
    } catch (err) {
      console.error('Fehler im Reset-Prozess:', err)
      setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('reset_code')
        .eq('email', email)
        .single()

      if (error || !user) {
        setMessage('Ein Fehler ist aufgetreten.')
        return
      }

      if (user.reset_code !== resetCode) {
        setMessage('Der eingegebene Code ist ungültig.')
        return
      }

      setStep('password')
      setMessage('')
    } catch (err) {
      setMessage('Ein Fehler ist aufgetreten.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Hash das neue Passwort
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update das Passwort und lösche den Reset-Code
      const { error } = await supabase
        .from('users')
        .update({ 
          password_hash: hashedPassword,
          reset_code: null 
        })
        .eq('email', email)

      if (error) throw error

      setMessage('Ihr Passwort wurde erfolgreich zurückgesetzt.')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      setMessage('Ein Fehler ist aufgetreten beim Zurücksetzen des Passworts.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-96">
        <button
          onClick={() => router.push('/auth/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Login
        </button>

        <h1 className="text-2xl font-bold mb-6">Passwort zurücksetzen</h1>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.includes('erfolgreich') || message.includes('gesendet')
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}>
            {message}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-Mail-Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Wird gesendet...' : 'Code anfordern'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reset-Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                placeholder="4-stelliger Code"
                maxLength={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Wird überprüft...' : 'Code bestätigen'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Neues Passwort</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                placeholder="Neues Passwort eingeben"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
} 