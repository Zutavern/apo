import { NextRequest, NextResponse } from 'next/server'

const MAUVE_API_URL = process.env.NEXT_PUBLIC_MAUVE_API_URL || 'https://demo.mauve.de/api'

interface ErrorResponse {
  error: string
  status: number
  details?: any
  timestamp: string
  path: string
  method: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const startTime = new Date()
  const path = (await params).path.join('/')
  
  console.log('🔵 Proxy-Anfrage gestartet:', {
    path,
    timestamp: startTime.toISOString(),
    headers: Object.fromEntries(request.headers)
  })

  try {
    const credentials = Buffer.from('demo:demo').toString('base64')
    const targetUrl = `${MAUVE_API_URL}/${path}`
    
    console.log('🟡 Weiterleitung an Mauve API:', {
      url: targetUrl,
      method: 'GET'
    })
    
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('🟡 Mauve API Antwort erhalten:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const responseText = await response.text()
      console.error('🔴 Mauve API Fehler:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText
      })

      const errorResponse: ErrorResponse = {
        error: 'Mauve API Fehler',
        status: response.status,
        details: {
          statusText: response.statusText,
          responseBody: responseText
        },
        timestamp: new Date().toISOString(),
        path,
        method: 'GET'
      }

      return new NextResponse(JSON.stringify(errorResponse), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const data = await response.json()
    console.log('🟢 Proxy-Anfrage erfolgreich:', {
      path,
      status: response.status,
      duration: `${new Date().getTime() - startTime.getTime()}ms`
    })

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('🔴 Proxy-Fehler:', {
      path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      duration: `${new Date().getTime() - startTime.getTime()}ms`
    })

    const errorResponse: ErrorResponse = {
      error: 'Interner Server-Fehler',
      status: 500,
      details: error instanceof Error ? {
        name: error.name,
        message: error.message
      } : { error },
      timestamp: new Date().toISOString(),
      path,
      method: 'GET'
    }

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 