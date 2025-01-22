import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function cleanContentType(contentType: string): string {
  // Entferne charset und andere Parameter
  return contentType.split(';')[0].trim()
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: Buffer, type: string }> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const type = cleanContentType(contentType)
    
    // Prüfe, ob der MIME-Type unterstützt wird
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      throw new Error(`MIME-Type ${type} wird nicht unterstützt`)
    }
    
    return { buffer, type }
  } catch (error) {
    throw new Error(`Fehler beim Laden des Bildes: ${error.message}`)
  }
}

async function ensureBucketExists() {
  const { data: bucket, error } = await supabase.storage.getBucket('news-images')
  
  if (error && error.message.includes('not found')) {
    const { data, error: createError } = await supabase.storage.createBucket('news-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    })
    
    if (createError) throw new Error(`Fehler beim Erstellen des Buckets: ${createError.message}`)
    console.log('Bucket news-images erstellt:', data)
  } else if (error) {
    throw new Error(`Fehler beim Überprüfen des Buckets: ${error.message}`)
  }
}

export async function GET() {
  try {
    // Stelle sicher, dass der Bucket existiert
    await ensureBucketExists()

    // Hole alle pending Einträge
    const { data: pendingImages, error: fetchError } = await supabase
      .from('news_images')
      .select('id, news_id, image_url')
      .eq('status', 'pending')
      .limit(10) // Verarbeite maximal 10 Bilder pro Aufruf

    if (fetchError) {
      throw new Error(`Fehler beim Laden der pending Bilder: ${fetchError.message}`)
    }

    if (!pendingImages || pendingImages.length === 0) {
      return NextResponse.json({ message: 'Keine ausstehenden Bilder zum Verarbeiten' })
    }

    const results = []
    
    // Verarbeite jedes Bild
    for (const image of pendingImages) {
      try {
        const { buffer, type } = await fetchImageAsBuffer(image.image_url)
        
        // Speichere das Bild im Storage Bucket
        const fileName = `${image.news_id}/${image.id}.${type.split('/')[1]}`
        const { error: uploadError } = await supabase.storage
          .from('news-images')
          .upload(fileName, buffer, {
            contentType: type,
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Fehler beim Hochladen des Bildes: ${uploadError.message}`)
        }

        // Hole die öffentliche URL des Bildes
        const { data: { publicUrl } } = supabase.storage
          .from('news-images')
          .getPublicUrl(fileName)

        // Aktualisiere den Datenbank-Eintrag
        const { error: updateError } = await supabase
          .from('news_images')
          .update({
            storage_path: fileName,
            mime_type: type,
            file_size: buffer.length,
            status: 'success',
            crawled_at: new Date().toISOString()
          })
          .eq('id', image.id)

        if (updateError) {
          throw new Error(`Fehler beim Speichern des Bildes: ${updateError.message}`)
        }

        results.push({
          id: image.id,
          status: 'success',
          size: buffer.length,
          url: publicUrl
        })

      } catch (error) {
        // Fehler für dieses spezifische Bild
        const { error: updateError } = await supabase
          .from('news_images')
          .update({
            status: 'error',
            error_message: error.message,
            crawled_at: new Date().toISOString()
          })
          .eq('id', image.id)

        results.push({
          id: image.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: `${results.length} Bilder verarbeitet`,
      results
    })

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 