import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: pharmacies, error } = await supabase
      .from('current_pharmacy_data')
      .select('*')
      .order('distance_value', { ascending: true })

    if (error) {
      console.error('Fehler beim Laden der Apotheken:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pharmacies || pharmacies.length === 0) {
      return NextResponse.json({ 
        message: 'Keine Apotheken im Notdienst gefunden',
        pharmacies: [] 
      })
    }

    // Formatierte Daten für die Anzeige
    const formattedPharmacies = pharmacies.map(pharmacy => ({
      id: pharmacy.id,
      name: pharmacy.Apothekenname,
      address: {
        street: pharmacy.Strasse,
        postalCode: pharmacy.PLZ,
        city: pharmacy.Ort
      },
      phone: pharmacy.Telefon,
      distance: pharmacy.Entfernung,
      emergencyServiceText: pharmacy.Notdiensttext,
      qrCode: pharmacy.qr_code_svg,
      position: pharmacy.Position,
      distanceValue: pharmacy.distance_value
    }))

    return NextResponse.json({
      message: `${pharmacies.length} Apotheken gefunden`,
      lastUpdated: new Date().toLocaleString('de-DE'),
      pharmacies: formattedPharmacies
    })

  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 
