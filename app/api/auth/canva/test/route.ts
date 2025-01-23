import { CanvaService } from '@/lib/services/canva'
import { cookies } from 'next/headers'

const canvaService = new CanvaService({
  clientId: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
  clientSecret: process.env.CANVA_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/canva/callback`
})

export async function GET() {
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
    </style>
</head>
<body>
    <h1>Canva OAuth Test</h1>
    
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
} 