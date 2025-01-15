'use client'

import Link from 'next/link'
import { UserSearch } from './components/UserSearch'
import { UserCard } from './components/UserCard'
import { useUsers } from './hooks/useUsers'
import { UserPlus } from 'lucide-react'

export default function AdminPage() {
  const {
    filteredUsers,
    searchQuery,
    setSearchQuery,
  } = useUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
        <Link
          href="/dashboard/admin/new"
          className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/20"
        >
          <UserPlus className="h-4 w-4" />
          Neuer Benutzer
        </Link>
      </div>
      
      <UserSearch 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <UserCard
            key={user.username}
            user={user}
          />
        ))}
      </div>
    </div>
  )
} 