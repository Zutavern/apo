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
    // Erstelle den Eintrag für Hohenmölsen
    const { data, error } = await supabase
      .from('locations')
      .upsert({
        name: 'Hohenmölsen',
        latitude: 51.1667,
        longitude: 12.0833
      }, {
        onConflict: 'name'
      })

    if (error) {
      console.error('Setup Error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { 
        status: 500 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Location erfolgreich eingerichtet' 
    })

  } catch (err) {
    console.error('Server Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
    }, { 
      status: 500 
    })
  }
} 