'use client'

import { Search } from 'lucide-react'

type UserSearchProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function UserSearch({ searchQuery, onSearchChange }: UserSearchProps) {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Benutzer suchen..."
        className="w-full pl-10 p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
} 