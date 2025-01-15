'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle, Lock, Edit, Trash2, ArrowLeft, Upload, Loader2 } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { Message } from '../components/Message'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{ username: string }>
}

type User = {
  username: string
  lastlogin: string | null
  email: string | null
  role: string | null
  created_at: string | null
  avatar_url: string | null
  avatar_path: string | null
  firstname: string | null
  lastname: string | null
}

const roles = ['Standardnutzer', 'Admin', 'Superadmin']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function UserProfilePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { handleChangePassword, handleChangeUsername, handleDeleteUser } = useUsers()
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState<'password' | 'username' | 'email' | 'role' | 'vorname' | 'nachname' | null>(null)
  const [newValue, setNewValue] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('Standardnutzer')
  const [isUploading, setIsUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('username, lastlogin, email, role, created_at, avatar_url, avatar_path, firstname, lastname')
        .eq('username', resolvedParams.username)
        .single()

      if (!error && data) {
        setUser(data)
        setSelectedRole(data.role || 'Standardnutzer')
      }
    }
    loadUser()
  }, [resolvedParams.username])

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
          
          // Behalte das originale Format bei (PNG oder JPEG)
          const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Blob konnte nicht erstellt werden'))
              }
            },
            outputFormat,
            0.8
          )
        }
      }
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'))
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Prüfe Dateigröße
      if (file.size > MAX_FILE_SIZE) {
        setMessage('Die Datei ist zu groß. Maximale Größe ist 5MB.')
        return
      }

      // Prüfe Dateityp
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        setMessage('Nur JPEG und PNG Dateien sind erlaubt.')
        return
      }

      try {
        setIsUploading(true)
        // Komprimiere das Bild
        const compressedBlob = await compressImage(file)
        const fileExt = file.type === 'image/png' ? 'png' : 'jpg'
        const compressedFile = new File([compressedBlob], file.name, {
          type: file.type
        })

        // Upload das Bild
        const filePath = `${resolvedParams.username}-${Date.now()}.${fileExt}`

        console.log('Starte Upload:', {
          bucket: 'avatars',
          path: filePath,
          fileSize: compressedFile.size,
          fileType: file.type
        })

        // Upload mit verbesserter Fehlerbehandlung
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('Upload Error:', uploadError)
          throw new Error(`Fehler beim Upload: ${uploadError.message}`)
        }

        // Generiere die öffentliche URL
        const { data } = await supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        const publicUrl = data.publicUrl

        console.log('Upload erfolgreich:', {
          path: filePath,
          url: publicUrl
        })

        // Update User
        const { error: updateError } = await supabase
          .from('users')
          .update({
            avatar_url: publicUrl,
            avatar_path: filePath
          })
          .eq('username', resolvedParams.username)

        if (updateError) {
          console.error('Update Error:', updateError)
          throw updateError
        }

        setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
        setMessage('Profilbild erfolgreich aktualisiert')
      } catch (error) {
        console.error('Fehler beim Bildupload:', error)
        setMessage(error instanceof Error ? error.message : 'Fehler beim Hochladen des Bildes. Bitte versuchen Sie es später erneut.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!newValue) return

    try {
      if (isEditing === 'password') {
        await handleChangePassword(resolvedParams.username, newValue)
        setMessage('Passwort erfolgreich geändert')
      } else if (isEditing === 'username') {
        await handleChangeUsername(resolvedParams.username, newValue)
        setMessage('Benutzername erfolgreich geändert')
        router.push(`/dashboard/admin/${newValue}`)
      } else if (isEditing === 'email') {
        const { error } = await supabase
          .from('users')
          .update({ email: newValue })
          .eq('username', resolvedParams.username)
        
        if (error) throw error
        setMessage('Email erfolgreich geändert')
        setUser(prev => prev ? { ...prev, email: newValue } : null)
      } else if (isEditing === 'vorname') {
        const { error } = await supabase
          .from('users')
          .update({ firstname: newValue })
          .eq('username', resolvedParams.username)
        
        if (error) throw error
        setMessage('Vorname erfolgreich geändert')
        setUser(prev => prev ? { ...prev, firstname: newValue } : null)
      } else if (isEditing === 'nachname') {
        const { error } = await supabase
          .from('users')
          .update({ lastname: newValue })
          .eq('username', resolvedParams.username)
        
        if (error) throw error
        setMessage('Nachname erfolgreich geändert')
        setUser(prev => prev ? { ...prev, lastname: newValue } : null)
      }
      setIsEditing(null)
      setNewValue('')
    } catch (error) {
      setMessage('Ein Fehler ist aufgetreten')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      await handleDeleteUser(resolvedParams.username)
      router.push('/dashboard/admin')
    }
  }

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole)
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('username', resolvedParams.username)

    if (error) {
      setMessage('Fehler beim Aktualisieren der Rolle')
    } else {
      setMessage('Rolle erfolgreich aktualisiert')
    }
  }

  return (
    <>
      <div className="px-4 mb-6">
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-16 h-16">
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profilbild"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-16 w-16 text-blue-500" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-gray-900 rounded-full p-1 cursor-pointer hover:bg-gray-800"
              >
                <Edit className="h-3 w-3 text-gray-400" />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold">
                  {user?.firstname && user?.lastname 
                    ? `${user.firstname} ${user.lastname}`
                    : resolvedParams.username
                  }
                </h1>
                <div className="text-sm text-gray-400 text-right">
                  <div>
                    Letzter Login: {user?.lastlogin ? new Date(user.lastlogin).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Noch nie eingeloggt'}
                  </div>
                  <div>
                    Erstellt am: {user?.created_at ? new Date(user.created_at).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Unbekannt'}
                  </div>
                </div>
              </div>
              <p className="text-gray-400">Benutzerprofil</p>
            </div>
          </div>

          <Message message={message} />

          <div className="space-y-6">
            {/* Benutzername ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Benutzername</h2>
                  <p className="text-gray-400 text-sm">Aktueller Name: {resolvedParams.username}</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing('username')
                    setNewValue(resolvedParams.username)
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                  <span>Ändern</span>
                </button>
              </div>
              {isEditing === 'username' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                    placeholder="Neuer Benutzername"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(null)
                        setNewValue('')
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Email</h2>
                  <p className="text-gray-400 text-sm">
                    {user?.email || 'Keine Email hinterlegt'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing('email')
                    setNewValue(user?.email || '')
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                  <span>Ändern</span>
                </button>
              </div>
              {isEditing === 'email' && (
                <div className="space-y-4">
                  <input
                    type="email"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                    placeholder="Neue Email-Adresse"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(null)
                        setNewValue('')
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vorname ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Vorname</h2>
                  <p className="text-gray-400 text-sm">
                    {user?.firstname || 'Kein Vorname hinterlegt'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing('vorname')
                    setNewValue(user?.firstname || '')
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                  <span>Ändern</span>
                </button>
              </div>
              {isEditing === 'vorname' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                    placeholder="Vorname eingeben"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(null)
                        setNewValue('')
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nachname ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Nachname</h2>
                  <p className="text-gray-400 text-sm">
                    {user?.lastname || 'Kein Nachname hinterlegt'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing('nachname')
                    setNewValue(user?.lastname || '')
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                  <span>Ändern</span>
                </button>
              </div>
              {isEditing === 'nachname' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                    placeholder="Nachname eingeben"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(null)
                        setNewValue('')
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Passwort ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Passwort</h2>
                  <p className="text-gray-400 text-sm">Setzen Sie ein neues Passwort</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing('password')
                    setNewValue('')
                  }}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Lock className="h-4 w-4" />
                  <span>Ändern</span>
                </button>
              </div>
              {isEditing === 'password' && (
                <div className="space-y-4">
                  <input
                    type="password"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                    placeholder="Neues Passwort"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(null)
                        setNewValue('')
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rolle ändern */}
            <div className="border-b border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Rolle</h2>
                  <p className="text-gray-400 text-sm">Aktuelle Rolle: {selectedRole}</p>
                </div>
              </div>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
              >
                {roles.map((role) => (
                  <option key={role} value={role} className="bg-gray-800">
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gefahrenzone außerhalb der Box */}
        <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h2 className="text-lg font-medium text-red-500 mb-2">Gefahrenzone</h2>
          <p className="text-gray-400 text-sm mb-4">
            Wenn Sie diesen Benutzer löschen, können die Daten nicht wiederhergestellt werden.
          </p>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            <span>Benutzer löschen</span>
          </button>
        </div>
      </div>
    </>
  )
} 