import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('username, created_at, lastlogin, role')
      
      if (error) throw error
      setUsers(users || [])
      setFilteredUsers(users || [])
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
    } catch (error) {
      setMessage('Fehler beim Löschen des Benutzers')
    }
  }

  const handleChangePassword = async (username: string, newPassword: string) => {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      const { error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('username', username)

      if (error) throw error

      setMessage('Passwort erfolgreich geändert')
    } catch (error) {
      console.error('Password update error:', error)
      setMessage('Fehler beim Ändern des Passworts')
    }
  }

  const handleChangeUsername = async (oldUsername: string, newUsername: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUsername)
        .single()

      if (existingUser) {
        setMessage('Dieser Benutzername ist bereits vergeben')
        return
      }

      const { error } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('username', oldUsername)

      if (error) throw error

      setMessage('Benutzername erfolgreich geändert')
      await loadUsers()
    } catch (error) {
      console.error('Username update error:', error)
      setMessage('Fehler beim Ändern des Benutzernamens')
    }
  }

  return {
    users,
    filteredUsers,
    searchQuery,
    setSearchQuery,
    handleDeleteUser,
    handleChangePassword,
    handleChangeUsername,
    message
  }
} 