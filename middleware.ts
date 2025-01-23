import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Nur für die Canva-Callback-Route
  if (request.nextUrl.pathname === '/api/auth/canva/callback') {
    const response = NextResponse.next()
    
    // Deaktiviere HTTP/2-Kompression
    response.headers.set('Content-Encoding', 'identity')
    response.headers.set('Transfer-Encoding', 'chunked')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/auth/canva/callback'
} 