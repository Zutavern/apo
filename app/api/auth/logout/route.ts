import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Erfolgreich abgemeldet' })
  
  // Cookie löschen
  response.cookies.set('auth', '', {
    httpOnly: true,
    expires: new Date(0)
  })
  
  return response
} 