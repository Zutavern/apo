import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Füge die Test-Nachricht in die news Tabelle ein
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .insert([{
        title: data.title,
        description: data.description,
        url: data.url,
        image: data.image,
        source: data.source,
        category: data.category,
        published_at: data.published_at
      }])
      .select()
      .single();

    if (newsError) {
      console.error('Fehler beim Einfügen der Test-Nachricht:', newsError);
      return NextResponse.json({ error: newsError.message }, { status: 400 });
    }

    // Wenn ein Bild-URL vorhanden ist, erstelle einen Eintrag in news_images
    if (data.image) {
      const { error: imageError } = await supabase
        .from('news_images')
        .insert([{
          news_id: newsData.id,
          image_url: data.image,
          status: 'pending'
        }]);

      if (imageError) {
        console.error('Fehler beim Erstellen des Bild-Eintrags:', imageError);
        // Wir geben trotzdem eine erfolgreiche Antwort zurück, da die Nachricht gespeichert wurde
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 });
  }
} 