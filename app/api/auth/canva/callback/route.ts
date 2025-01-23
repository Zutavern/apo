import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  console.log('=== Canva Callback Start ===')
  console.log('Callback URL:', request.url)
  
  const url = new URL(request.url)
  const searchParams = url.searchParams
  console.log('Search Params:', Object.fromEntries(searchParams))
  
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  console.log('Code:', code)
  console.log('Error:', error)

  // Fehlerbehandlung
  if (error) {
    console.error('OAuth Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=${error}`)
  }

  if (!code) {
    console.error('No code received')
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
    console.log('Token Request Parameters:', {
      code,
      client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID,
      client_secret: process.env.CANVA_CLIENT_SECRET?.substring(0, 5) + '...',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
    })

    const tokenResponse = await fetch('https://www.canva.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'User-Agent': 'vercel-oauth-client/1.0'
      },
      // @ts-ignore
      http2: false, // Force HTTP/1.1
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        code_verifier: codeVerifier.value,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
      }).toString()
    });

    console.log('Token Response Status:', tokenResponse.status);
    console.log('Token Response Headers:', Object.fromEntries(tokenResponse.headers));
    
    const responseText = await tokenResponse.text();
    console.log('Token Response Body:', responseText);
    console.log('Request Parameters:', {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID,
      code_verifier: codeVerifier.value,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenResponse.status, responseText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_failed&status=${tokenResponse.status}&details=${encodeURIComponent(responseText)}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
      console.log('Parsed Token Data:', {
        ...tokenData,
        access_token: tokenData.access_token ? '***' : undefined
      });
    } catch (error) {
      console.error('Error parsing token response:', error);
      console.error('Raw response:', responseText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=invalid_token_response`);
    }

    if (!tokenData.access_token) {
      console.error('No access token in response');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=no_access_token`);
    }

    // Token in einem sicheren Cookie speichern
    cookieStore.set('canva_access_token', tokenData.access_token, {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })

    console.log('=== Canva Callback Success ===')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?success=true`)
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social/settings?error=token_exchange_error`)
  }
} 