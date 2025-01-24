'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Trash2, ArrowLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Typen
interface WeatherBackground {
  id: string
  file_name: string
  bucket_name: string
  orientation: 'portrait' | 'landscape'
  storage_path: string
  created_at: string
  is_selected: boolean
}

// Konstanten
const PORTRAIT_BUCKET = 'bg-wetter-pt'
const LANDSCAPE_BUCKET = 'bg-wetter-ls'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Hilfskomponenten
const ImageUploadButton = ({ 
  orientation, 
  onUpload, 
  isUploading 
}: { 
  orientation: 'portrait' | 'landscape'
  onUpload: (file: File) => Promise<void>
  isUploading: boolean 
}) => {
  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) await onUpload(file)
    }
    input.click()
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isUploading}
      className="bg-blue-500 hover:bg-blue-600"
    >
      {isUploading ? (
        'Wird hochgeladen...'
      ) : (
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Hochladen</span>
        </div>
      )}
    </Button>
  )
}

const SafeImage = ({ src, alt, className }: { 
  src: string
  alt: string
  className?: string 
}) => {
  const [error, setError] = useState(false)
  const optimizedSrc = `${src}?width=600&quality=80&resize=contain`

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900/50 rounded-lg ${className}`}>
        <p className="text-gray-400 text-sm text-center p-4">
          Bild konnte nicht geladen werden
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px]">
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className={`rounded-lg object-contain ${className}`}
        onError={() => setError(true)}
        priority
      />
    </div>
  )
}

const EmptyState = ({ type, onUpload }: { 
  type: 'portrait' | 'landscape'
  onUpload: (file: File) => Promise<void>
}) => {
  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) await onUpload(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-lg border border-white/10">
      <p className="text-gray-400 text-center mb-4">
        Noch keine {type === 'portrait' ? 'Portrait' : 'Landscape'} Bilder hochgeladen
      </p>
      <Button
        onClick={handleClick}
        className="bg-blue-500 hover:bg-blue-600"
      >
        <Upload className="h-4 w-4 mr-2" />
        Erstes Bild hochladen
      </Button>
    </div>
  )
}

// Hauptkomponente
export default function WeatherBackgrounds() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // State
  const [portraitImages, setPortraitImages] = useState<WeatherBackground[]>([])
  const [landscapeImages, setLandscapeImages] = useState<WeatherBackground[]>([])
  const [isPortraitUploading, setIsPortraitUploading] = useState(false)
  const [isLandscapeUploading, setIsLandscapeUploading] = useState(false)

  // Bilder laden
  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    try {
      const [portraitResult, landscapeResult] = await Promise.all([
        supabase
          .from('weather_backgrounds')
          .select('*')
          .eq('orientation', 'portrait')
          .order('created_at', { ascending: false }),
        supabase
          .from('weather_backgrounds')
          .select('*')
          .eq('orientation', 'landscape')
          .order('created_at', { ascending: false })
      ])

      if (portraitResult.error) throw portraitResult.error
      if (landscapeResult.error) throw landscapeResult.error

      setPortraitImages(portraitResult.data || [])
      setLandscapeImages(landscapeResult.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error)
      toast.error('Fehler beim Laden der Bilder')
    }
  }

  // Upload Handler
  const handleUpload = async (file: File, orientation: 'portrait' | 'landscape') => {
    const setUploading = orientation === 'portrait' 
      ? setIsPortraitUploading 
      : setIsLandscapeUploading

    setUploading(true)
    
    try {
      // Validierung
      if (!file.type.startsWith('image/')) {
        throw new Error('Ungültiger Dateityp. Bitte nur Bilddateien hochladen.')
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Datei ist zu groß. Maximale Größe ist 5MB.')
      }

      const bucketName = orientation === 'portrait' ? PORTRAIT_BUCKET : LANDSCAPE_BUCKET
      const timestamp = Date.now()
      const sanitizedFileName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_')
      const fileName = `${timestamp}-${sanitizedFileName}`

      console.log('Starte Upload:', {
        bucketName,
        fileName,
        fileType: file.type,
        fileSize: file.size
      })

      // Upload zur Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Storage Upload Fehler:', uploadError)
        throw new Error(`Fehler beim Upload: ${uploadError.message}`)
      }

      console.log('Upload erfolgreich:', uploadData)

      // Warte kurz, um sicherzustellen, dass der Upload verarbeitet wurde
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Datenbank-Eintrag
      const { error: dbError, data: dbData } = await supabase
        .from('weather_backgrounds')
        .insert({
          file_name: sanitizedFileName,
          bucket_name: bucketName,
          orientation: orientation,
          storage_path: fileName,
          is_selected: false
        })
        .select()
        .single()

      if (dbError) {
        console.error('Datenbank Fehler:', dbError)
        // Cleanup bei DB-Fehler
        await supabase.storage
          .from(bucketName)
          .remove([fileName])
        throw new Error(`Datenbankfehler: ${dbError.message}`)
      }

      console.log('Datenbank Eintrag erstellt:', dbData)

      toast.success(`${orientation === 'portrait' ? 'Portrait' : 'Landscape'}-Bild erfolgreich hochgeladen`)
      
      // Warte kurz, bevor die Bilder neu geladen werden
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadImages()
    } catch (error) {
      console.error('Upload Fehler:', error instanceof Error ? error.message : 'Unbekannter Fehler')
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hochladen des Bildes')
    } finally {
      setUploading(false)
    }
  }

  // Delete Handler
  const handleDelete = async (image: WeatherBackground) => {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      return
    }

    try {
      const { error: storageError } = await supabase.storage
        .from(image.bucket_name)
        .remove([image.storage_path])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('weather_backgrounds')
        .delete()
        .eq('id', image.id)

      if (dbError) throw dbError

      if (image.orientation === 'portrait') {
        setPortraitImages(prev => prev.filter(img => img.id !== image.id))
      } else {
        setLandscapeImages(prev => prev.filter(img => img.id !== image.id))
      }

      toast.success(`${image.orientation === 'portrait' ? 'Portrait' : 'Landscape'}-Bild gelöscht`)
    } catch (error) {
      console.error('Löschfehler:', error)
      toast.error('Fehler beim Löschen des Bildes')
    }
  }

  // Select Handler
  const handleSelect = async (image: WeatherBackground) => {
    try {
      const { error: selectError } = await supabase
        .from('weather_backgrounds')
        .update({ is_selected: true })
        .eq('id', image.id)

      if (selectError) throw selectError

      // Optimistic Update
      if (image.orientation === 'portrait') {
        setPortraitImages(prev => prev.map(img => ({
          ...img,
          is_selected: img.id === image.id
        })))
      } else {
        setLandscapeImages(prev => prev.map(img => ({
          ...img,
          is_selected: img.id === image.id
        })))
      }

      toast.success(`${image.orientation === 'portrait' ? 'Portrait' : 'Landscape'}-Bild als Standard ausgewählt`)
    } catch (error) {
      console.error('Auswahlfehler:', error)
      toast.error('Fehler beim Auswählen des Bildes')
      await loadImages() // Lade bei Fehler die Bilder neu
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Hintergründe</h1>
          <p className="text-sm text-gray-400">
            Bitte laden Sie Hintergründe für die Wetter Screens hoch und treffen Sie Ihre Auswahl
          </p>
        </div>
      </div>

      {/* Portrait Bilder */}
      <Card className="bg-gray-900/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Portrait Bilder</h2>
            <ImageUploadButton
              orientation="portrait"
              onUpload={(file) => handleUpload(file, 'portrait')}
              isUploading={isPortraitUploading}
            />
          </div>
          
          {portraitImages.length === 0 ? (
            <EmptyState 
              type="portrait" 
              onUpload={(file: File) => handleUpload(file, 'portrait')} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portraitImages.map(image => {
                const imageUrl = supabase.storage
                  .from(image.bucket_name)
                  .getPublicUrl(image.storage_path)
                  .data.publicUrl

                return (
                  <div key={image.id} className="space-y-2">
                    <SafeImage
                      src={imageUrl}
                      alt={image.file_name}
                      className={image.is_selected ? 'ring-2 ring-green-500' : ''}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(image)}
                        className="w-1/2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </Button>
                      <Button
                        variant={image.is_selected ? "secondary" : "default"}
                        onClick={() => handleSelect(image)}
                        className="w-1/2"
                        disabled={image.is_selected}
                      >
                        {image.is_selected ? 'Ausgewählt' : 'Auswählen'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Landscape Bilder */}
      <Card className="bg-gray-900/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Landscape Bilder</h2>
            <ImageUploadButton
              orientation="landscape"
              onUpload={(file) => handleUpload(file, 'landscape')}
              isUploading={isLandscapeUploading}
            />
          </div>
          
          {landscapeImages.length === 0 ? (
            <EmptyState 
              type="landscape" 
              onUpload={(file: File) => handleUpload(file, 'landscape')} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landscapeImages.map(image => {
                const imageUrl = supabase.storage
                  .from(image.bucket_name)
                  .getPublicUrl(image.storage_path)
                  .data.publicUrl

                return (
                  <div key={image.id} className="space-y-2">
                    <SafeImage
                      src={imageUrl}
                      alt={image.file_name}
                      className={image.is_selected ? 'ring-2 ring-green-500' : ''}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(image)}
                        className="w-1/2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </Button>
                      <Button
                        variant={image.is_selected ? "secondary" : "default"}
                        onClick={() => handleSelect(image)}
                        className="w-1/2"
                        disabled={image.is_selected}
                      >
                        {image.is_selected ? 'Ausgewählt' : 'Auswählen'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 