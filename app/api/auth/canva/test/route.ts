import { CanvaService } from '@/lib/services/canva'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const canvaService = new CanvaService({
  clientId: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
  clientSecret: process.env.CANVA_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Prüfe Authentifizierung
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('sb-access-token')
    
    if (!sessionCookie) {
      return new Response('Nicht authentifiziert. Bitte zuerst einloggen.', {
        status: 401,
        headers: {
          'Content-Type': 'text/html'
        }
      })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(sessionCookie.value)
    if (userError || !user) {
      return new Response('Nicht authentifiziert. Bitte zuerst einloggen.', {
        status: 401,
        headers: {
          'Content-Type': 'text/html'
        }
      })
    }

    // Generiere einen neuen Code Verifier
    const codeVerifier = canvaService.generateCodeVerifier()
    
    // Speichere den Code Verifier in einem Cookie
    cookieStore.set('canva_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5 // 5 Minuten
    })

    // Generiere die Autorisierungs-URL
    const authUrl = await canvaService.getAuthorizationUrl(codeVerifier)

    // Generiere die Test-HTML
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Canva OAuth Test</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
        line-height: 1.5;
        background: #1a1a1a;
        color: #ffffff;
      }
      pre {
        background: #2a2a2a;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
      }
      .button {
        display: inline-block;
        background: #00C4CC;
        color: white;
        padding: 0.75rem 1.5rem;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 1rem;
      }
      .button:hover {
        background: #00b3b9;
      }
      .user-info {
        background: #2a2a2a;
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
      }
    </style>
</head>
<body>
    <h1>Canva OAuth Test</h1>
    
    <div class="user-info">
      <h2>Benutzer-Info</h2>
      <p>Eingeloggt als: ${user.email}</p>
      <p>Benutzer-ID: ${user.id}</p>
    </div>

    <p>Code Verifier (für später gespeichert im Cookie):</p>
    <pre>${codeVerifier}</pre>
    
    <p>Klicken Sie auf den Button um die Autorisierung zu starten:</p>
    <a href="${authUrl}" class="button">Canva Autorisierung starten</a>

    <p style="margin-top: 2rem; color: #666;">
      <strong>Hinweis:</strong> Der Code Verifier wurde automatisch in einem sicheren Cookie gespeichert 
      und wird beim Callback verwendet.
    </p>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    })
  } catch (error) {
    console.error('Test route error:', error)
    return new Response('Ein Fehler ist aufgetreten: ' + (error as Error).message, {
      status: 500,
      headers: {
        'Content-Type': 'text/html'
      }
    })
  }
} 