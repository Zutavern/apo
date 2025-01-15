import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '../types'

const ITEMS_PER_PAGE = 8

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      // Lade die Gesamtanzahl der Benutzer für die Paginierung
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Berechne die Gesamtanzahl der Seiten
      const total = count || 0
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))

      // Lade die Benutzer für die aktuelle Seite
      const { data: users, error } = await supabase
        .from('users')
        .select('username, created_at, lastlogin, role')
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
        .order('username', { ascending: true })
      
      if (error) throw error
      setUsers(users || [])
      setFilteredUsers(users || [])
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage]) // Lade neu wenn sich die Seite ändert

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

  const handleChangeUsername = async (oldUsername: string, newUsername: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('username', oldUsername)

      if (error) throw error
      await loadUsers()
      setMessage('Benutzername erfolgreich geändert')
    } catch (error) {
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
    } catch (error) {
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
    handleChangePassword,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading
  }
} 