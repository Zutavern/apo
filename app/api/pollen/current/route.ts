import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET() {
  try {
    // 1. Location ID für Hohenmölsen abrufen
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Hohenmölsen')
      .single()

    if (locationError || !locationData) {
      throw new Error('Location nicht gefunden')
    }

    // 2. Aktuelle Pollendaten abrufen
    const { data: pollenData, error: pollenError } = await supabase
      .from('pollen')
      .select('*')
      .eq('location_id', locationData.id)
      .single()

    if (pollenError) {
      console.error('Pollen Error:', pollenError)
      throw new Error('Fehler beim Abrufen der Pollendaten')
    }

    if (!pollenData) {
      throw new Error('Keine Pollendaten verfügbar')
    }

    console.log('Rohdaten aus DB:', pollenData)

    // Daten in das Format der PollenCard transformieren
    const transformedData = {
      success: true,
      data: {
        alder: pollenData.alder_pollen || 0,
        birch: pollenData.birch_pollen || 0,
        grass: pollenData.grass_pollen || 0,
        mugwort: pollenData.mugwort_pollen || 0,
        ragweed: pollenData.ragweed_pollen || 0,
        last_updated: pollenData.last_updated
      }
    }

    console.log('Transformierte Daten:', transformedData)
    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 