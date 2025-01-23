export const runtime = 'edge'

import { cookies } from 'next/headers'
import { CanvaService } from '@/lib/services/canva'

const canvaService = new CanvaService({
  clientId: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
  clientSecret: process.env.CANVA_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    console.log('Debug - Callback Start:', {
      code: code?.substring(0, 20) + '...',
      error,
      url: request.url
    })

    if (error) {
      console.log('Debug - OAuth Error:', error)
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=${error}`
        }
      })
    }

    if (!code) {
      console.log('Debug - No Code Received')
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_code`
        }
      })
    }

    const cookieStore = cookies()
    const codeVerifier = cookieStore.get('canva_code_verifier')

    console.log('Debug - Code Verifier:', {
      exists: !!codeVerifier,
      value: codeVerifier?.value?.substring(0, 10) + '...'
    })

    if (!codeVerifier) {
      console.log('Debug - No Code Verifier Found')
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_verifier`
        }
      })
    }

    console.log('Debug - Token Request Start')
    const tokenData = await canvaService.exchangeCodeForToken(code, codeVerifier.value)

    console.log('Debug - Token Data:', {
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    })

    if (!tokenData.access_token) {
      console.log('Debug - No Access Token in Response')
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_access_token`
        }
      })
    }

    console.log('Debug - Success, Setting Cookie')
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?success=true`
      }
    })

    // Cookie setzen
    response.headers.append('Set-Cookie', `canva_access_token=${tokenData.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`) // 30 Tage

    return response
  } catch (error) {
    console.error('Canva callback error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}`
      }
    })
  }
} 