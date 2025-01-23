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

export async function POST(request: Request) {
  try {
    // Hole den aktuellen Benutzer
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('sb-access-token')
    if (!sessionCookie) {
      return new Response(null, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(sessionCookie.value)
    if (userError || !user) {
      return new Response(null, { status: 401 })
    }

    // Token aus der Datenbank löschen
    await canvaService.deleteToken(user.id)

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Canva disconnect error:', error)
    return new Response(null, { status: 500 })
  }
} 