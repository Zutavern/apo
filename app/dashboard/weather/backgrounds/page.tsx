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
}) => (
  <Button
    onClick={() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) onUpload(file)
      }
      input.click()
    }}
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

const SafeImage = ({ src, alt, className }: { 
  src: string
  alt: string
  className?: string 
}) => {
  const [error, setError] = useState(false)

  // Optimierte URL mit Supabase Transformation
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
  onUpload: () => void 
}) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-lg border border-white/10">
    <p className="text-gray-400 text-center mb-4">
      Noch keine {type === 'portrait' ? 'Portrait' : 'Landscape'} Bilder hochgeladen
    </p>
    <Button
      onClick={onUpload}
      className="bg-blue-500 hover:bg-blue-600"
    >
      <Upload className="h-4 w-4 mr-2" />
      Erstes Bild hochladen
    </Button>
  </div>
)

// Hauptkomponente
export default function WeatherBackgrounds() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // State
  const [portraitImages, setPortraitImages] = useState<WeatherBackground[]>([])
  const [landscapeImages, setLandscapeImages] = useState<WeatherBackground[]>([])
  const [isPortraitUploading, setIsPortraitUploading] = useState(false)
  const [isLandscapeUploading, setIsLandscapeUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

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
    try {
      // Validierung
      if (!file.type.startsWith('image/')) {
        toast.error('Bitte nur Bilddateien hochladen')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Bild darf nicht größer als 5MB sein')
        return
      }

      const bucketName = orientation === 'portrait' ? PORTRAIT_BUCKET : LANDSCAPE_BUCKET
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}-${sanitizedFileName}`

      // Upload zur Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Datenbank-Eintrag
      const { error: dbError } = await supabase
        .from('weather_backgrounds')
        .insert({
          file_name: sanitizedFileName,
          bucket_name: bucketName,
          orientation: orientation,
          storage_path: fileName,
          is_selected: false
        })

      if (dbError) {
        // Cleanup bei DB-Fehler
        await supabase.storage
          .from(bucketName)
          .remove([fileName])
        throw dbError
      }

      toast.success(`${orientation === 'portrait' ? 'Portrait' : 'Landscape'}-Bild erfolgreich hochgeladen`)
      await loadImages()
    } catch (error) {
      console.error('Upload Fehler:', error)
      toast.error('Fehler beim Hochladen des Bildes')
    }
  }

  // Delete Handler
  const handleDelete = async (image: WeatherBackground) => {
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

      toast.success(`${image.orientation === 'portrait' ? 'Portrait' : 'Landscape'}-Bild ausgewählt`)
    } catch (error) {
      console.error('Auswahlfehler:', error)
      toast.error('Fehler beim Auswählen des Bildes')
      await loadImages() // Refresh bei Fehler
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hintergründe</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bitte laden Sie Hintergründe für die Wetter Screens hoch und treffen Sie Ihre Auswahl
            </p>
          </div>
        </div>
      </div>

      {/* Portrait Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Portrait Format</h2>
          <ImageUploadButton
            orientation="portrait"
            onUpload={async (file) => {
              setIsPortraitUploading(true)
              await handleUpload(file, 'portrait')
              setIsPortraitUploading(false)
            }}
            isUploading={isPortraitUploading}
          />
        </div>

        {portraitImages.length === 0 ? (
          <EmptyState 
            type="portrait" 
            onUpload={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  setIsPortraitUploading(true)
                  await handleUpload(file, 'portrait')
                  setIsPortraitUploading(false)
                }
              }
              input.click()
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portraitImages.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4 space-y-4">
                  <SafeImage
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.bucket_name}/${image.storage_path}`}
                    alt={image.file_name}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    {deletingImageId === image.id ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-1/2"
                          onClick={() => {
                            handleDelete(image)
                            setDeletingImageId(null)
                          }}
                        >
                          Ja
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-1/2"
                          onClick={() => setDeletingImageId(null)}
                        >
                          Nein
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-1/2"
                          onClick={() => setDeletingImageId(image.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                        <Button
                          variant={image.is_selected ? "secondary" : "default"}
                          size="sm"
                          className="w-1/2"
                          onClick={() => handleSelect(image)}
                        >
                          {image.is_selected ? "Ausgewählt" : "Auswählen"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Landscape Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Landscape Format</h2>
          <ImageUploadButton
            orientation="landscape"
            onUpload={async (file) => {
              setIsLandscapeUploading(true)
              await handleUpload(file, 'landscape')
              setIsLandscapeUploading(false)
            }}
            isUploading={isLandscapeUploading}
          />
        </div>

        {landscapeImages.length === 0 ? (
          <EmptyState 
            type="landscape"
            onUpload={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  setIsLandscapeUploading(true)
                  await handleUpload(file, 'landscape')
                  setIsLandscapeUploading(false)
                }
              }
              input.click()
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landscapeImages.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4 space-y-4">
                  <SafeImage
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.bucket_name}/${image.storage_path}`}
                    alt={image.file_name}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    {deletingImageId === image.id ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-1/2"
                          onClick={() => {
                            handleDelete(image)
                            setDeletingImageId(null)
                          }}
                        >
                          Ja
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-1/2"
                          onClick={() => setDeletingImageId(null)}
                        >
                          Nein
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-1/2"
                          onClick={() => setDeletingImageId(image.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                        <Button
                          variant={image.is_selected ? "secondary" : "default"}
                          size="sm"
                          className="w-1/2"
                          onClick={() => handleSelect(image)}
                        >
                          {image.is_selected ? "Ausgewählt" : "Auswählen"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
} 