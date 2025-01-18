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
    // Aktiviere RLS für die Tabellen
    const { error: rls1 } = await supabase.rpc('enable_rls', { table_name: 'locations' })
    const { error: rls2 } = await supabase.rpc('enable_rls', { table_name: 'current_weather' })

    if (rls1 || rls2) {
      console.error('RLS Error:', rls1 || rls2)
      throw new Error('Fehler beim Aktivieren von RLS')
    }

    // Erstelle Policies für locations
    const { error: policy1 } = await supabase.rpc('create_policy', {
      table_name: 'locations',
      policy_name: 'Enable read access for all users',
      definition: 'true',
      action: 'SELECT'
    })

    // Erstelle Policies für current_weather
    const { error: policy2 } = await supabase.rpc('create_policy', {
      table_name: 'current_weather',
      policy_name: 'Enable read access for all users',
      definition: 'true',
      action: 'SELECT'
    })

    if (policy1 || policy2) {
      console.error('Policy Error:', policy1 || policy2)
      throw new Error('Fehler beim Erstellen der Policies')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS-Policies erfolgreich eingerichtet' 
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