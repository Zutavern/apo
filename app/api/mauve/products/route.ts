import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const MAUVE_API_URL = process.env.NEXT_PUBLIC_MAUVE_API_URL || 'https://demo.mauve.de/api'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth-token')

    if (!authToken) {
      return new NextResponse(JSON.stringify({ error: 'Nicht authentifiziert' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const response = await fetch(`${MAUVE_API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${authToken.value}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Produkte konnten nicht abgerufen werden: ${response.status} ${response.statusText}\nBody: ${error}`)
    }

    const data = await response.json()
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Produkte:', error)
    return new NextResponse(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 