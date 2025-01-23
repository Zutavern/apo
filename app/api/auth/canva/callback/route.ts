export const runtime = 'edge'

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { CanvaService } from '@/lib/services/canva'

const canvaService = new CanvaService({
  clientId: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
  clientSecret: process.env.CANVA_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Code Verifier aus Cookie holen
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

    // Hole den aktuellen Benutzer
    const sessionCookie = cookieStore.get('sb-access-token')
    if (!sessionCookie) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=not_authenticated`
        }
      })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(sessionCookie.value)
    if (userError || !user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=not_authenticated`
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

    // Token in der Datenbank speichern
    await canvaService.saveToken(user.id, tokenData)

    console.log('Debug - Success, Token Saved')
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?success=true`
      }
    })
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