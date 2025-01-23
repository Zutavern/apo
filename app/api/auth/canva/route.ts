import { cookies } from 'next/headers'
import { CanvaService } from '@/lib/services/canva'

const canvaService = new CanvaService({
  clientId: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
  clientSecret: process.env.CANVA_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
})

export async function GET() {
  try {
    // Generiere einen neuen Code Verifier
    const codeVerifier = canvaService.generateCodeVerifier()
    
    // Speichere den Code Verifier in einem Cookie
    const cookieStore = cookies()
    cookieStore.set('canva_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5 // 5 Minuten
    })

    // Generiere die Autorisierungs-URL
    const authUrl = await canvaService.getAuthorizationUrl(codeVerifier)

    // Leite zur Canva-Autorisierungsseite weiter
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl
      }
    })
  } catch (error) {
    console.error('Canva auth error:', error)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/dashboard/social/settings?error=auth_failed`
      }
    })
  }
} 