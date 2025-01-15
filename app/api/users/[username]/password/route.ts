import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { users, saveUsers } from '@/app/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username
    const { newPassword } = await request.json()

    if (!users.has(username)) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    users.set(username, hashedPassword)
    saveUsers()

    return NextResponse.json({ message: 'Passwort erfolgreich geändert' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Fehler beim Ändern des Passworts' },
      { status: 500 }
    )
  }
} 