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
    // Erstelle die weather_forecast Tabelle
    const { error: createError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'weather_forecast',
      definition: `
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        location_id uuid REFERENCES locations(id),
        hourly jsonb NOT NULL,
        last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      `
    })

    if (createError) {
      console.error('Fehler beim Erstellen der Tabelle:', createError)
      return NextResponse.json({ 
        success: false, 
        error: createError.message 
      }, { 
        status: 500 
      })
    }

    // Erstelle RLS-Policy für die Tabelle
    const { error: policyError } = await supabase.rpc('create_policy', {
      table_name: 'weather_forecast',
      policy_name: 'Enable read access for all users',
      definition: 'true',
      action: 'SELECT'
    })

    if (policyError) {
      console.error('Fehler beim Erstellen der Policy:', policyError)
      return NextResponse.json({ 
        success: false, 
        error: policyError.message 
      }, { 
        status: 500 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Forecast-Tabelle und Policy erfolgreich erstellt' 
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