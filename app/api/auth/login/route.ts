import { NextResponse } from 'next/server'
import { loginUser } from '@/app/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const { user, error } = await loginUser(username, password)

    if (error) {
      return NextResponse.json({ message: error }, { status: 401 })
    }

    // Last-Login mit Admin-Client aktualisieren
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ lastlogin: new Date().toISOString() })
      .eq('username', username)

    if (updateError) {
      console.error('Fehler beim Aktualisieren des Last-Login:', updateError)
    }

    const response = NextResponse.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      user: { username: user.username }
    })

    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
} 