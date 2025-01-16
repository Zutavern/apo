import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    try {
      console.log('Starte Laden der Benutzer...')
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          username,
          created_at,
          lastlogin,
          role,
          firstname,
          lastname
        `)
      
      if (error) {
        console.error('Supabase Fehler:', error.message, error.details, error.hint)
        throw error
      }

      console.log('Geladene Daten:', data)
      
      if (!data) {
        console.warn('Keine Daten von Supabase erhalten')
        setUsers([])
        setFilteredUsers([])
        return
      }

      // Validiere die Daten und mappe die Feldnamen
      const validUsers = data.map(user => ({
        username: user.username || '',
        created_at: user.created_at || new Date().toISOString(),
        lastlogin: user.lastlogin || null,
        role: user.role || 'user',
        first_name: user.firstname || null,  // Mapping von firstname zu first_name
        last_name: user.lastname || null     // Mapping von lastname zu last_name
      }))

      console.log('Verarbeitete Benutzerdaten:', validUsers)
      
      // Sortiere die Benutzer nach Benutzername
      const sortedUsers = validUsers.sort((a, b) => 
        a.username.localeCompare(b.username)
      )
      
      setUsers(sortedUsers)
      setFilteredUsers(sortedUsers)
    } catch (error: any) {
      console.error('Detaillierter Fehler:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        details: error.details,
        hint: error.hint
      })
      setMessage('Fehler beim Laden der Benutzer')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user => {
      const searchString = searchQuery.toLowerCase()
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim()
      
      return user.username.toLowerCase().includes(searchString) ||
             fullName.includes(searchString)
    })
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleDeleteUser = async (username: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username)

      if (error) throw error
      
      await loadUsers()
      setMessage('Benutzer erfolgreich gelöscht')
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error.message)
      setMessage('Fehler beim Löschen des Benutzers')
    }
  }

  const handleChangeUsername = async (oldUsername: string, newUsername: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('username', oldUsername)

      if (error) throw error
      await loadUsers()
      setMessage('Benutzername erfolgreich geändert')
    } catch (error: any) {
      console.error('Fehler beim Ändern des Benutzernamens:', error.message)
      setMessage('Fehler beim Ändern des Benutzernamens')
    }
  }

  const handleChangePassword = async (username: string, newPassword: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('username', username)

      if (error) throw error
      setMessage('Passwort erfolgreich geändert')
    } catch (error: any) {
      console.error('Fehler beim Ändern des Passworts:', error.message)
      setMessage('Fehler beim Ändern des Passworts')
    }
  }

  return {
    filteredUsers,
    searchQuery,
    setSearchQuery,
    message,
    handleDeleteUser,
    handleChangeUsername,
    handleChangePassword
  }
} 