import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Fehlende Umgebungsvariablen für Supabase')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data: weatherData, error } = await supabase
      .from('current_weather')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Database Error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Wetterdaten' },
        { status: 500 }
      )
    }

    return NextResponse.json(weatherData)
  } catch (err) {
    console.error('Server Error:', err)
    return NextResponse.json(
      { error: 'Ein interner Serverfehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 