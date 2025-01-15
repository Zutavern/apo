'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle, Lock, Edit, Trash2, ArrowLeft } from 'lucide-react'
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
}

const roles = ['Standardnutzer', 'Admin', 'Superadmin']

export default function UserProfilePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { handleChangePassword, handleChangeUsername, handleDeleteUser } = useUsers()
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState<'password' | 'username' | 'email' | 'role' | null>(null)
  const [newValue, setNewValue] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('Standardnutzer')

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('username, lastlogin, email, role')
        .eq('username', resolvedParams.username)
        .single()

      if (!error && data) {
        setUser(data)
        setSelectedRole(data.role || 'Standardnutzer')
      }
    }
    loadUser()
  }, [resolvedParams.username])

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
    <div>
      <button
        onClick={() => router.push('/dashboard/admin')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </button>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-8">
          <UserCircle className="h-16 w-16 text-blue-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-bold">{resolvedParams.username}</h1>
              <span className="text-sm text-gray-400">
                {user?.lastlogin ? new Date(user.lastlogin).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Noch nie eingeloggt'}
              </span>
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
              <button
                onClick={() => {
                  setIsEditing('role')
                }}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-400"
              >
                <Edit className="h-4 w-4" />
                <span>Ändern</span>
              </button>
            </div>
            {isEditing === 'role' && (
              <div className="space-y-4">
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-gray-800 text-gray-100">
                      {role}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(null)
                    }}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      handleRoleChange(selectedRole)
                      setIsEditing(null)
                    }}
                    className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Benutzer löschen */}
          {resolvedParams.username !== 'Dan' && (
            <div>
              <h2 className="text-lg font-medium text-red-500 mb-2">Gefahrenzone</h2>
              <p className="text-gray-400 text-sm mb-4">
                Wenn Sie diesen Benutzer löschen, können die Daten nicht wiederhergestellt werden.
              </p>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Benutzer löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 