import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Client initialisieren
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Fehlende Umgebungsvariablen für Supabase')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request: Request) {
  try {
    const { id, is_expanded } = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID ist erforderlich'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('current_weather_data')
      .update({ is_expanded })
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Aktualisieren des Status:', error)
      return NextResponse.json({
        success: false,
        message: `Fehler beim Aktualisieren: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status erfolgreich aktualisiert'
    })

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error)
    return NextResponse.json({
      success: false,
      message: 'Ein unerwarteter Fehler ist aufgetreten'
    }, { status: 500 })
  }
} 