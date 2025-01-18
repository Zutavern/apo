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

    // 2. Pollendaten von der API abrufen
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=51.1667&longitude=12.0833&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
    )

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Pollendaten')
    }

    const pollenApiData = await response.json()
    const currentHour = new Date().getHours()

    // 3. Aktuelle Pollenwerte extrahieren
    const currentPollenData = {
      location_id: locationData.id,
      alder_pollen: pollenApiData.hourly.alder_pollen[currentHour] || 0,
      birch_pollen: pollenApiData.hourly.birch_pollen[currentHour] || 0,
      grass_pollen: pollenApiData.hourly.grass_pollen[currentHour] || 0,
      mugwort_pollen: pollenApiData.hourly.mugwort_pollen[currentHour] || 0,
      ragweed_pollen: pollenApiData.hourly.ragweed_pollen[currentHour] || 0
    }

    // 4. Daten in Supabase speichern (UPSERT)
    const { error: upsertError } = await supabase
      .from('pollen')
      .upsert(currentPollenData)

    if (upsertError) {
      throw new Error('Fehler beim Speichern der Pollendaten')
    }

    return NextResponse.json({
      success: true,
      message: 'Pollendaten aktualisiert',
      data: currentPollenData
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 