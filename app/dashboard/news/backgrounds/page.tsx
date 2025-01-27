'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Trash2, ArrowLeft, Upload, ArrowRight, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

interface UploadFile {
  file: File
  preview: string
  progress: number
  error?: string
}

// Konstanten
const PORTRAIT_BUCKET = 'bg-news-pt'
const LANDSCAPE_BUCKET = 'bg-news-ls'
const MAX_FILE_SIZE = 14 * 1024 * 1024 // 14MB
const ITEMS_PER_PAGE = 3

// Hilfskomponenten
const ImageUploadButton = ({ 
  orientation, 
  onUpload, 
  isUploading 
}: { 
  orientation: 'portrait' | 'landscape'
  onUpload: (files: FileList) => void
  isUploading: boolean 
}) => (
  <Button
    onClick={() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/*'
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files?.length) onUpload(files)
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
        <span>Bilder auswählen</span>
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
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Bilder laden
  useEffect(() => {
    loadImages()
  }, [])

  // Cleanup für Vorschau-URLs
  useEffect(() => {
    return () => {
      uploadFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview)
      })
    }
  }, [uploadFiles])

  const handleFilesSelected = (files: FileList, orientation: 'portrait' | 'landscape') => {
    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0
    }))
    setUploadFiles(newFiles)
    setCurrentOrientation(orientation)
    setIsUploadDialogOpen(true)
  }

  const handleFileRemove = (index: number) => {
    setUploadFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUploadAll = async () => {
    const setUploading = currentOrientation === 'portrait' 
      ? setIsPortraitUploading 
      : setIsLandscapeUploading

    try {
      setUploading(true)

      for (let i = 0; i < uploadFiles.length; i++) {
        const { file } = uploadFiles[i]

        // Validierung
        if (!file.type.startsWith('image/')) {
          setUploadFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], error: 'Keine Bilddatei' }
            return newFiles
          })
          continue
        }

        if (file.size > MAX_FILE_SIZE) {
          setUploadFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], error: 'Datei zu groß (max. 14MB)' }
            return newFiles
          })
          continue
        }

        const bucketName = currentOrientation === 'portrait' ? PORTRAIT_BUCKET : LANDSCAPE_BUCKET
        const timestamp = Date.now()
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        try {
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
              orientation: currentOrientation,
              storage_path: fileName,
              is_selected: false
            })

          if (dbError) {
            await supabase.storage.from(bucketName).remove([fileName])
            throw dbError
          }

          // Update Progress
          setUploadFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], progress: 100 }
            return newFiles
          })

        } catch (error) {
          setUploadFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], error: 'Upload fehlgeschlagen' }
            return newFiles
          })
        }
      }

      await loadImages()
      toast.success('Bilder erfolgreich hochgeladen')
      setIsUploadDialogOpen(false)
      setUploadFiles([])
    } catch (error) {
      console.error('Upload Fehler:', error)
      toast.error('Fehler beim Hochladen der Bilder')
    } finally {
      setUploading(false)
    }
  }

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">News Hintergründe</h1>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bilder hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <Image
                        src={file.preview}
                        alt={file.file.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    {file.error ? (
                      <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center p-2 text-center text-sm">
                        {file.error}
                      </div>
                    ) : file.progress > 0 ? (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="h-1 w-20 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleFileRemove(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setUploadFiles([])
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
              >
                Abbrechen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files?.length) {
                      const newFiles: UploadFile[] = Array.from(files).map(file => ({
                        file,
                        preview: URL.createObjectURL(file),
                        progress: 0
                      }))
                      setUploadFiles(prev => [...prev, ...newFiles])
                    }
                  }
                  input.click()
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                disabled={isPortraitUploading || isLandscapeUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Weitere Bilder
              </Button>
              <Button
                onClick={handleUploadAll}
                disabled={uploadFiles.length === 0 || isPortraitUploading || isLandscapeUploading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isPortraitUploading || isLandscapeUploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Wird hochgeladen...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Alle hochladen</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Portrait Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Portrait Hintergründe</h2>
          <ImageUploadButton
            orientation="portrait"
            onUpload={(files) => handleFilesSelected(files, 'portrait')}
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
                if (file) handleFilesSelected(new FileList([file]), 'portrait')
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
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Landscape Hintergründe</h2>
          <ImageUploadButton
            orientation="landscape"
            onUpload={(files) => handleFilesSelected(files, 'landscape')}
            isUploading={isLandscapeUploading}
          />
        </div>

        {landscapeImages.length === 0 ? (
          <Card className="bg-gray-900/50 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-lg text-gray-400 text-center">
                Keine Landscape-Hintergründe vorhanden
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedLandscapeImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.bucket_name}/${image.storage_path}`}
                        alt={image.file_name}
                        fill
                        className="object-cover"
                      />
                    </div>
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
            {landscapePagesCount > 1 && (
              <div className="flex justify-center gap-4 mt-6">
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
            )}
          </>
        )}
      </section>
    </div>
  )
} 