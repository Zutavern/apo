'use client'

import Link from 'next/link'
import { UserSearch } from './components/UserSearch'
import { UserCard } from './components/UserCard'
import { useUsers } from './hooks/useUsers'
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminPage() {
  const {
    filteredUsers,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading
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

      <div className="grid gap-4 mb-6">
        {isLoading ? (
          // Lade-Animation
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[72px] bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Keine Benutzer gefunden
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.username}
              user={user}
            />
          ))
        )}
      </div>

      {/* Paginierung */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
} 