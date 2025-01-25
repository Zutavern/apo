import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

// Keine Caching für aktuelle Daten
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Konstanten für 4K Auflösung
const PORTRAIT_WIDTH = 2160
const PORTRAIT_HEIGHT = 3840

export default async function WeatherPortrait() {
  // Supabase Client initialisieren
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Ausgewähltes Portrait-Bild abrufen
    const { data: background, error } = await supabase
      .from('weather_backgrounds')
      .select('*')
      .eq('orientation', 'portrait')
      .eq('is_selected', true)
      .single()

    if (error) {
      console.error('Fehler beim Laden des Hintergrunds:', error)
      return <div>Fehler beim Laden des Hintergrunds</div>
    }

    if (!background) {
      return <div>Kein Hintergrundbild ausgewählt</div>
    }

    // Public URL mit Transformationsparametern generieren
    const { data: { publicUrl } } = supabase.storage
      .from(background.bucket_name)
      .getPublicUrl(background.storage_path)

    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        <Image
          src={publicUrl}
          alt="Wetter Hintergrund"
          width={PORTRAIT_WIDTH}
          height={PORTRAIT_HEIGHT}
          priority
          className="max-h-screen w-auto"
          quality={100}
        />
      </div>
    )
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return <div>Ein unerwarteter Fehler ist aufgetreten</div>
  }
} 