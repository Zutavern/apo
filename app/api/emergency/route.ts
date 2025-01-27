import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: pharmacies, error } = await supabase
      .from('current_pharmacy_data')
      .select('*')
      .order('distance')

    if (error) throw error

    // Formatiere die Daten für die Kartenansicht
    const formattedPharmacies = pharmacies.map(pharmacy => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: {
        street: pharmacy.street,
        postalCode: pharmacy.postal_code,
        city: pharmacy.city
      },
      phone: pharmacy.phone,
      distance: pharmacy.distance,
      emergencyServiceText: pharmacy.emergency_service_text,
      qrCode: pharmacy.qr_code_svg
    }))

    return NextResponse.json(
      { pharmacies: formattedPharmacies },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 
