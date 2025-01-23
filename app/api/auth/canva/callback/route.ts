import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  console.log('Callback aufgerufen mit URL:', request.url)
  
  const { searchParams } = new URL(request.url)
  console.log('Search Params:', Object.fromEntries(searchParams))
  
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  console.log('Code:', code)
  console.log('Error:', error)

  // Fehlerbehandlung
  if (error) {
    console.error('Canva OAuth Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=${error}`)
  }

  if (!code) {
    console.error('No code received from Canva')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_code`)
  }

  // Code Verifier aus Cookie holen
  const cookieStore = cookies()
  const codeVerifier = cookieStore.get('canva_code_verifier')
  console.log('Code Verifier from Cookie:', codeVerifier?.value)

  if (!codeVerifier) {
    console.error('No code verifier found in cookies')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_verifier`)
  }

  try {
    console.log('Starting token exchange...')
    // Token Exchange durchführen
    const tokenResponse = await fetch('https://www.canva.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier.value,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')

    // Token in einem sicheren Cookie speichern
    cookieStore.set('canva_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })

    // Erfolgreiche Verbindung
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?success=true`)
  } catch (error) {
    console.error('Error during token exchange:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=unexpected_error`)
  }
} 