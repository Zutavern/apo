import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('=== FUNCTION LOADED ===')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
}

console.log('Cleanup function started')

serve(async (req) => {
  console.log('=== REQUEST RECEIVED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('=== CORS REQUEST ===')
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }

  try {
    console.log('=== PROCESSING REQUEST ===')
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    
    const body = JSON.parse(rawBody)
    console.log('Parsed request body:', body)
    
    // Extrahiere die news_id aus dem gelöschten Datensatz
    let news_id
    if (body.type === 'DELETE' && body.table === 'news' && body.old_record) {
      // Webhook-Format
      console.log('Webhook payload detected')
      news_id = body.old_record.id
    } else {
      // Direktes Format
      news_id = body.news_id
    }
    
    console.log('News ID to cleanup:', news_id)

    if (!news_id) {
      throw new Error('news_id ist erforderlich')
    }

    // Supabase Client initialisieren
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log('Supabase client initialized')

    // Finde alle zugehörigen Bilder
    const { data: images, error: fetchError } = await supabaseClient
      .from('news_images')
      .select('id, local_image_path')
      .eq('news_id', news_id)

    if (fetchError) {
      throw fetchError
    }

    console.log('Found images to delete:', images)

    // Lösche die Bilder aus dem Storage
    for (const image of images || []) {
      if (image.local_image_path) {
        console.log('Attempting to delete image from storage:', image.local_image_path)
        
        try {
          const { data: deleteData, error: deleteStorageError } = await supabaseClient
            .storage
            .from('news-images')
            .remove([image.local_image_path])

          if (deleteStorageError) {
            console.error('Error deleting from storage:', deleteStorageError)
            console.error('Error details:', JSON.stringify(deleteStorageError))
          } else {
            console.log('Successfully deleted from storage:', image.local_image_path)
            console.log('Delete response:', deleteData)
          }
        } catch (storageError) {
          console.error('Unexpected error during storage deletion:', storageError)
          console.error('Error details:', JSON.stringify(storageError))
        }
      }
    }

    // Lösche die Einträge aus der news_images Tabelle
    if (images && images.length > 0) {
      const { error: deleteDbError } = await supabaseClient
        .from('news_images')
        .delete()
        .eq('news_id', news_id)

      if (deleteDbError) {
        throw deleteDbError
      }
    }

    console.log('Cleanup completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_images: images?.length || 0 
      }),
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