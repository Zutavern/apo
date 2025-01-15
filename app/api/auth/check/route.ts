import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get('auth')

    if (!authCookie) {
      return NextResponse.json(
        { message: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      status: 'authenticated',
      message: 'Erfolgreich authentifiziert'
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Nicht authentifiziert' },
      { status: 401 }
    )
  }
} 