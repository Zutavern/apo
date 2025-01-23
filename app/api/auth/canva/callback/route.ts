export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const tokenResponse = await fetch('https://www.canva.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        code_verifier: codeVerifier.value,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
      })
    })

    console.log('Debug - Token Response:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      headers: Object.fromEntries(tokenResponse.headers)
    })

    // Prüfe den Content-Type
    const contentType = tokenResponse.headers.get('content-type')
    console.log('Debug - Content-Type:', contentType)

    let data
    const responseText = await tokenResponse.text()
    console.log('Debug - Raw Response:', responseText.substring(0, 200))

    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.log('Debug - JSON Parse Error:', parseError)
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=invalid_response&status=${tokenResponse.status}&details=${encodeURIComponent(`Ungültige Antwort vom Server (${contentType}): ${responseText.substring(0, 100)}...`)}`
        }
      })
    }

    console.log('Debug - Token Data:', {
      hasAccessToken: !!data.access_token,
      error: data.error,
      errorDescription: data.error_description
    })

    if (!tokenResponse.ok) {
      console.log('Debug - Token Exchange Failed:', data)
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_failed&status=${tokenResponse.status}&details=${encodeURIComponent(JSON.stringify(data))}`
        }
      })
    }

    if (!data.access_token) {
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
    response.headers.append('Set-Cookie', `canva_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`)

    return response
  } catch (error) {
    console.log('Debug - Unexpected Error:', error)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_error&details=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`
      }
    })
  }
} 