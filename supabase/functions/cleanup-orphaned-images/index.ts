// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")
console.log('=== CLEANUP ORPHANED IMAGES FUNCTION LOADED ===')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  console.log('=== REQUEST RECEIVED ===')
  console.log('Method:', req.method)
  
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
    console.log('=== STARTING CLEANUP ===')

    // Supabase Client initialisieren mit dem Service Role Key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log('Supabase client initialized')

    // Hole alle Bilder aus dem Storage Bucket
    const { data: bucketFiles, error: bucketError } = await supabaseClient
      .storage
      .from('news-images')
      .list()

    if (bucketError) {
      console.error('Error listing bucket files:', bucketError)
      throw bucketError
    }

    console.log('Found files in bucket:', bucketFiles?.length || 0)

    // Hole alle aktiven Bildpfade aus der Datenbank
    const { data: dbImages, error: dbError } = await supabaseClient
      .from('news_images')
      .select('local_image_path')

    if (dbError) {
      console.error('Error fetching database images:', dbError)
      throw dbError
    }

    console.log('Found images in database:', dbImages?.length || 0)

    // Erstelle Set von aktiven Bildpfaden
    const activeImagePaths = new Set(dbImages?.map(img => img.local_image_path) || [])
    
    // Finde verwaiste Bilder
    const orphanedFiles = bucketFiles?.filter(file => !activeImagePaths.has(file.name)) || []
    
    console.log('Found orphaned files:', orphanedFiles.length)

    // Lösche verwaiste Bilder
    const deletedFiles = []
    const failedFiles = []

    for (const file of orphanedFiles) {
      try {
        console.log('Attempting to delete:', file.name)
        
        const { error: deleteError } = await supabaseClient
          .storage
          .from('news-images')
          .remove([file.name])

        if (deleteError) {
          console.error('Error deleting file:', file.name, deleteError)
          failedFiles.push({ name: file.name, error: deleteError.message })
        } else {
          console.log('Successfully deleted:', file.name)
          deletedFiles.push(file.name)
        }
      } catch (error) {
        console.error('Unexpected error deleting file:', file.name, error)
        failedFiles.push({ name: file.name, error: error.message })
      }
    }

    console.log('=== CLEANUP COMPLETED ===')
    console.log('Successfully deleted files:', deletedFiles.length)
    console.log('Failed to delete files:', failedFiles.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        total_files: bucketFiles?.length || 0,
        active_files: dbImages?.length || 0,
        orphaned_files: orphanedFiles.length,
        deleted_files: deletedFiles,
        failed_files: failedFiles
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cleanup-orphaned-images' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
