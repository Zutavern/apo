import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
}

console.log('Function started')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }

  try {
    console.log('Processing request')
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    
    const body = JSON.parse(rawBody)
    console.log('Parsed request body:', body)
    
    // Extrahiere die Daten entweder aus dem record oder direkt aus dem body
    let image_url, id
    if (body.type === 'INSERT' && body.table === 'news_images' && body.record) {
      // Webhook-Format
      console.log('Webhook payload detected')
      image_url = body.record.image_url
      id = body.record.id
    } else {
      // Direktes Format
      image_url = body.image_url
      id = body.id
    }
    
    console.log('Extracted data:', { image_url, id })

    if (!image_url || !id) {
      throw new Error('image_url und id sind erforderlich')
    }

    // Supabase Client initialisieren
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log('Supabase client initialized')

    // Bild herunterladen
    console.log('Downloading image from:', image_url)
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      throw new Error(`Fehler beim Herunterladen des Bildes: ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()
    const fileName = `${id}-${Date.now()}.${imageBlob.type.split('/')[1] || 'jpg'}`
    console.log('Generated filename:', fileName)

    // Bild in den Bucket hochladen
    console.log('Uploading to bucket')
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('news-images')
      .upload(fileName, imageBlob, {
        contentType: imageBlob.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }
    console.log('Upload successful:', uploadData)

    // URL des hochgeladenen Bildes abrufen
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('news-images')
      .getPublicUrl(fileName)
    console.log('Public URL:', publicUrl)

    // news_images Tabelle aktualisieren
    console.log('Updating database')
    const { error: updateError } = await supabaseClient
      .from('news_images')
      .update({ 
        local_image_path: fileName,
        public_url: publicUrl,
        status: 'pending'
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }
    console.log('Database updated successfully')

    return new Response(
      JSON.stringify({ success: true, publicUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 