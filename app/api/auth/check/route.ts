import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth')

    if (!authCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Fehler bei der Authentifizierungsprüfung:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
} 