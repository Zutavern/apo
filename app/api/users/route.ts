import { NextResponse } from 'next/server'
import { users } from '@/app/lib/auth'

export async function GET() {
  try {
    const userArray = Array.from(users.entries()).map(([username]) => ({
      username
    }))
    
    return NextResponse.json({ users: userArray })
  } catch (error) {
    return NextResponse.json(
      { message: 'Fehler beim Laden der Benutzer' },
      { status: 500 }
    )
  }
} 