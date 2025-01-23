export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=${error}`
        }
      })
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_code`
        }
      })
    }

    const cookieStore = cookies()
    const codeVerifier = cookieStore.get('canva_code_verifier')

    if (!codeVerifier) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_verifier`
        }
      })
    }

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

    const data = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_failed&status=${tokenResponse.status}&details=${encodeURIComponent(JSON.stringify(data))}`
        }
      })
    }

    if (!data.access_token) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_access_token`
        }
      })
    }

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
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_error`
      }
    })
  }
} 