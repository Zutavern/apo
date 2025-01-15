'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import { supabase, getStorageUrl } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import Image from 'next/image'

const roles = ['Standardnutzer', 'Admin', 'Superadmin']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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
  const [isUploading, setIsUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = document.createElement('img')
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context nicht verfügbar'))
            return
          }

          // Skaliere das Bild um 20%
          const width = img.width * 0.8
          const height = img.height * 0.8
          
          canvas.width = width
          canvas.height = height
          
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Blob konnte nicht erstellt werden'))
              }
            },
            'image/jpeg',
            0.8
          )
        }
      }
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'))
    })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Prüfe Dateigröße
      if (file.size > MAX_FILE_SIZE) {
        setMessage('Die Datei ist zu groß. Maximale Größe ist 5MB.')
        return
      }

      // Prüfe Dateityp
      if (!file.type.startsWith('image/')) {
        setMessage('Nur Bilddateien sind erlaubt.')
        return
      }

      try {
        setIsUploading(true)
        // Komprimiere das Bild
        const compressedBlob = await compressImage(file)
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
        })

        setAvatarFile(compressedFile)
        setAvatarPreview(URL.createObjectURL(compressedBlob))
        setMessage('')
      } catch (error) {
        setMessage('Fehler bei der Bildverarbeitung')
        console.error('Bildverarbeitungsfehler:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const uploadAvatar = async (username: string): Promise<{ avatar_url: string; avatar_path: string } | null> => {
    if (!avatarFile) return null

    try {
      setIsUploading(true)
      const fileExt = 'jpg' // Wir speichern immer als JPG nach der Komprimierung
      const filePath = `${username}-${Date.now()}.${fileExt}`

      console.log('Starte Upload:', {
        bucket: 'avatars',
        path: filePath,
        fileSize: avatarFile.size
      })

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        throw uploadError
      }

      // Generiere die öffentliche URL
      const publicUrl = getStorageUrl('avatars', filePath)

      console.log('Upload erfolgreich:', {
        path: filePath,
        url: publicUrl
      })

      return {
        avatar_url: publicUrl,
        avatar_path: filePath
      }
    } catch (error) {
      console.error('Fehler beim Avatar-Upload:', error)
      setMessage('Fehler beim Hochladen des Avatars. Bitte versuchen Sie es später erneut.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

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

      // Upload Avatar wenn vorhanden
      const avatarData = await uploadAvatar(formData.username)

      // Erstelle neuen Benutzer
      const newUser = {
        username: formData.username,
        password_hash: hashedPassword,
        email: formData.email,
        created_at: new Date().toISOString(),
        lastlogin: null,
        role: formData.role,
        avatar_url: avatarData?.avatar_url || null,
        avatar_path: avatarData?.avatar_path || null
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profilbild
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-900/50 border border-gray-700">
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                ) : avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profilbild Vorschau"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`cursor-pointer bg-gray-900/50 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-900/70 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? 'Wird verarbeitet...' : 'Bild auswählen'}
                </label>
                <span className="text-xs text-gray-400">
                  Max. 5MB, wird automatisch komprimiert
                </span>
              </div>
            </div>
          </div>

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
            disabled={isLoading || isUploading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird erstellt...' : 'Benutzer erstellen'}
          </button>
        </form>
      </div>
    </div>
  )
} 