'use client'

import { Lock, Edit } from 'lucide-react'

type UserModalProps = {
  type: 'password' | 'username'
  username: string
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}

export function UserModal({ type, username, value, onChange, onSave, onClose }: UserModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-6">
          {type === 'password' ? (
            <>
              <Lock className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium">
                Passwort ändern für {username}
              </h3>
            </>
          ) : (
            <>
              <Edit className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium">
                Benutzername ändern
              </h3>
            </>
          )}
        </div>

        <input
          type={type === 'password' ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === 'password' ? 'Neues Passwort' : 'Neuer Benutzername'}
          className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg mb-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            {type === 'password' ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
} 