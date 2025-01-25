'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Trash2, ArrowLeft, Upload, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

// Typen
interface NewsBackground {
  id: string
  file_name: string
  bucket_name: string
  orientation: 'portrait' | 'landscape'
  storage_path: string
  created_at: string
  is_selected: boolean
}

// Konstanten
const PORTRAIT_BUCKET = 'bg-news-pt'
const LANDSCAPE_BUCKET = 'bg-news-ls'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ITEMS_PER_PAGE = 3

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

const SafeImage = ({ src, alt }: { 
  src: string
  alt: string
}) => {
  const [error, setError] = useState(false)
  const optimizedSrc = `${src}?width=600&height=400&resize=contain&format=webp`

  useEffect(() => {
    console.log('Versuche Bild zu laden:', optimizedSrc)
  }, [optimizedSrc])

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900/50 rounded-lg h-[300px]">
        <div className="text-center p-4">
          <p className="text-gray-400 text-sm mb-2">
            Bild konnte nicht geladen werden
          </p>
          <p className="text-gray-500 text-xs break-all">
            {optimizedSrc}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px]">
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className="rounded-lg object-contain"
        onError={(e) => {
          console.error('Bildfehler:', e)
          setError(true)
        }}
        sizes="(max-width: 768px) 100vw, 33vw"
        priority
      />
    </div>
  )
}

// Hauptkomponente
export default function NewsBackgrounds() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // State
  const [portraitImages, setPortraitImages] = useState<NewsBackground[]>([])
  const [landscapeImages, setLandscapeImages] = useState<NewsBackground[]>([])
  const [isPortraitUploading, setIsPortraitUploading] = useState(false)
  const [isLandscapeUploading, setIsLandscapeUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [portraitPage, setPortraitPage] = useState(1)
  const [landscapePage, setLandscapePage] = useState(1)

  // Bilder laden
  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    try {
      const [portraitResult, landscapeResult] = await Promise.all([
        supabase
          .from('news_backgrounds')
          .select()
          .eq('orientation', 'portrait')
          .order('created_at', { ascending: false }),
        supabase
          .from('news_backgrounds')
          .select()
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

    try {
      setUploading(true)

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
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

      // Upload zur Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Datenbank-Eintrag
      const { error: dbError } = await supabase
        .from('news_backgrounds')
        .insert({
          file_name: file.name,
          bucket_name: bucketName,
          orientation: orientation,
          storage_path: fileName,
          is_selected: false
        })

      if (dbError) {
        await supabase.storage.from(bucketName).remove([fileName])
        throw dbError
      }

      toast.success('Bild erfolgreich hochgeladen')
      await loadImages()
    } catch (error) {
      console.error('Upload Fehler:', error)
      toast.error('Fehler beim Hochladen des Bildes')
    } finally {
      setUploading(false)
    }
  }

  // Delete Handler
  const handleDelete = async (image: NewsBackground) => {
    try {
      const { error: storageError } = await supabase.storage
        .from(image.bucket_name)
        .remove([image.storage_path])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('news_backgrounds')
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
  const handleSelect = async (image: NewsBackground) => {
    try {
      // Zuerst alle Bilder der gleichen Orientierung deselektieren
      const { error: updateError } = await supabase
        .from('news_backgrounds')
        .update({ is_selected: false })
        .eq('orientation', image.orientation)

      if (updateError) throw updateError

      // Dann das ausgewählte Bild selektieren
      const { error: selectError } = await supabase
        .from('news_backgrounds')
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

  // Paging
  const portraitPagesCount = Math.ceil(portraitImages.length / ITEMS_PER_PAGE)
  const landscapePagesCount = Math.ceil(landscapeImages.length / ITEMS_PER_PAGE)
  
  const paginatedPortraitImages = portraitImages.slice(
    (portraitPage - 1) * ITEMS_PER_PAGE,
    portraitPage * ITEMS_PER_PAGE
  )
  
  const paginatedLandscapeImages = landscapeImages.slice(
    (landscapePage - 1) * ITEMS_PER_PAGE,
    landscapePage * ITEMS_PER_PAGE
  )

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
              Bitte laden Sie Hintergründe für die News Screens hoch und treffen Sie Ihre Auswahl
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
            onUpload={file => handleUpload(file, 'portrait')}
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
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleUpload(file, 'portrait')
              }
              input.click()
            }} 
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedPortraitImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4 space-y-4">
                    <SafeImage
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.bucket_name}/${image.storage_path}`}
                      alt={image.file_name}
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
            
            {/* Paging Controls für Portrait */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setPortraitPage(p => Math.max(1, p - 1))}
                disabled={portraitPage === 1}
                className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vorherige
              </Button>
              <span className="flex items-center px-4 py-2 rounded-md bg-gray-900/30 border border-gray-700 text-sm">
                Seite {portraitPage} von {portraitPagesCount}
              </span>
              <Button
                variant="outline"
                onClick={() => setPortraitPage(p => Math.min(portraitPagesCount, p + 1))}
                disabled={portraitPage === portraitPagesCount}
                className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors duration-200"
              >
                Nächste
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Landscape Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Landscape Format</h2>
          <ImageUploadButton
            orientation="landscape"
            onUpload={file => handleUpload(file, 'landscape')}
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
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleUpload(file, 'landscape')
              }
              input.click()
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedLandscapeImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4 space-y-4">
                    <SafeImage
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.bucket_name}/${image.storage_path}`}
                      alt={image.file_name}
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
            
            {/* Paging Controls für Landscape */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setLandscapePage(p => Math.max(1, p - 1))}
                disabled={landscapePage === 1}
                className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vorherige
              </Button>
              <span className="flex items-center px-4 py-2 rounded-md bg-gray-900/30 border border-gray-700 text-sm">
                Seite {landscapePage} von {landscapePagesCount}
              </span>
              <Button
                variant="outline"
                onClick={() => setLandscapePage(p => Math.min(landscapePagesCount, p + 1))}
                disabled={landscapePage === landscapePagesCount}
                className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors duration-200"
              >
                Nächste
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
} 