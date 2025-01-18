import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Hole alle Daten ohne Filter
    const { data, error, count } = await supabase
      .from('current_weather')
      .select('*', { count: 'exact' })

    // Hole auch die Tabellenstruktur
    const { data: tableInfo } = await supabase
      .rpc('test_table_info', { table_name: 'current_weather' })

    return NextResponse.json({
      error: error ? error.message : null,
      rowCount: count,
      firstRow: data?.[0] || null,
      allData: data || [],
      tableInfo
    }, { 
      status: error ? 500 : 200 
    })
  } catch (err) {
    console.error('Server Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      details: err
    }, { 
      status: 500 
    })
  }
} 