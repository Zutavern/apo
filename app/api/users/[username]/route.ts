import { NextResponse } from 'next/server'
import { users, saveUsers } from '@/app/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username
    
    if (username === 'Dan') {
      return NextResponse.json(
        { message: 'Der Standardbenutzer kann nicht gelöscht werden' },
        { status: 400 }
      )
    }

    if (!users.has(username)) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    users.delete(username)
    saveUsers()
    
    return NextResponse.json({ message: 'Benutzer erfolgreich gelöscht' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Benutzers' },
      { status: 500 }
    )
  }
} 