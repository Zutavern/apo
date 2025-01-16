'use client'

import { UserCircle } from 'lucide-react'
import Link from 'next/link'
import type { User } from '../types'

type UserCardProps = {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  const formatLastLogin = (lastlogin: string | null) => {
    if (!lastlogin) return 'Noch nie eingeloggt'
    const date = new Date(lastlogin)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Bestimme den Anzeigenamen
  const hasFullName = user.first_name && user.last_name
  const displayName = hasFullName
    ? `${user.first_name} ${user.last_name}`
    : user.username

  return (
    <Link
      href={`/dashboard/admin/${user.username}`}
      className="block bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-lg">{displayName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-500">
            {user.role || 'Standardnutzer'}
          </span>
          <span className="text-sm text-gray-400">
            {formatLastLogin(user.lastlogin)}
          </span>
        </div>
      </div>
    </Link>
  )
} 