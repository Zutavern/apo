'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

const roles = ['Standardnutzer', 'Admin', 'Superadmin']

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'Standardnutzer'
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Prüfe ob Benutzer bereits existiert
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .single()

      if (existingUser) {
        setMessage('Dieser Benutzername existiert bereits')
        setIsLoading(false)
        return
      }

      // Hashe das Passwort
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(formData.password, salt)

      // Erstelle neuen Benutzer
      const newUser = {
        username: formData.username,
        password_hash: hashedPassword,
        email: formData.email,
        created_at: new Date().toISOString(),
        lastlogin: null,
        role: formData.role
      }

      // Debug Logging
      console.log('Versuche Benutzer zu erstellen mit Daten:', {
        ...newUser,
        password_hash: '[HIDDEN]'
      })

      try {
        // Prüfe Tabellenstruktur
        const { data: tableInfo, error: tableError } = await supabase
          .from('users')
          .select('*')
          .limit(1)

        console.log('Tabellen-Response:', { tableInfo, tableError })

        if (tableError) {
          throw new Error(`Fehler beim Prüfen der Tabellenstruktur: ${tableError.message}`)
        }

        // Erstelle Benutzer
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()

        if (error) {
          throw new Error(`Supabase Fehler: ${error.message}`)
        }

        if (!data || data.length === 0) {
          throw new Error('Keine Daten zurückgegeben')
        }

        console.log('Benutzer erfolgreich erstellt:', data[0])
        setMessage('Benutzer erfolgreich erstellt')
        router.push('/dashboard/admin')
      } catch (error) {
        console.error('Fehler:', error)
        setMessage(error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten')
        setIsLoading(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      console.error('Fehler beim Erstellen des Benutzers:', errorMessage)
      setMessage(`Ein Fehler ist aufgetreten: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => router.push('/dashboard/admin')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </button>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Neuen Benutzer erstellen</h1>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('erfolgreich') 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              placeholder="Benutzername eingeben"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              placeholder="Passwort eingeben"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              placeholder="Email eingeben"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Rolle
            </label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
            >
              {roles.map((role) => (
                <option key={role} value={role} className="bg-gray-800 text-gray-100">
                  {role}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird erstellt...' : 'Benutzer erstellen'}
          </button>
        </form>
      </div>
    </div>
  )
} 