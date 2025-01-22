import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Prüfe den Authorization Header für Cron-Job Sicherheit
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Rufe den Bild-Verarbeitungs-Endpoint auf
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/news/images/process`, {
      method: 'GET'
    })

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 