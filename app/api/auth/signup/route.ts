import { NextResponse } from 'next/server'
import { createUser } from '@/app/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    const { user, error } = await createUser(username, password)

    if (error) {
      return NextResponse.json(
        { message: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Registrierung erfolgreich',
      user: { username: user.username }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
} 