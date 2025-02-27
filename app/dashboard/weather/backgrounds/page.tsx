'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Trash2, ArrowLeft, Upload, ArrowRight, Loader2, X, CheckCircle, Circle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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

interface UploadFile {
  file: File
  id: string
  preview?: string
  progress: number
  error?: string
}

// Konstanten
const PORTRAIT_BUCKET = 'bg-wetter-pt'
const LANDSCAPE_BUCKET = 'bg-wetter-ls'
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

const SafeImage = ({ 
  src, 
  alt,
  className,
  fill = true
}: { 
  src: string
  alt: string
  className?: string
  fill?: boolean
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
        fill={fill}
        className={className || "rounded-lg object-contain"}
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
export default function WeatherBackgrounds() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [portraitImages, setPortraitImages] = useState<WeatherBackground[]>([])
  const [landscapeImages, setLandscapeImages] = useState<WeatherBackground[]>([])
  const [isPortraitUploading, setIsPortraitUploading] = useState(false)
  const [isLandscapeUploading, setIsLandscapeUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [portraitPage, setPortraitPage] = useState(1)
  const [landscapePage, setLandscapePage] = useState(1)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  // Paging
  const portraitPageCount = Math.ceil(portraitImages.length / ITEMS_PER_PAGE)
  const landscapePageCount = Math.ceil(landscapeImages.length / ITEMS_PER_PAGE)
  const paginatedPortraitImages = portraitImages.slice(
    (portraitPage - 1) * ITEMS_PER_PAGE,
    portraitPage * ITEMS_PER_PAGE
  )
  const paginatedLandscapeImages = landscapeImages.slice(
    (landscapePage - 1) * ITEMS_PER_PAGE,
    landscapePage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    loadImages()
  }, [])

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const loadImages = async () => {
    try {
      const [portraitResult, landscapeResult] = await Promise.all([
        supabase
          .from('weather_backgrounds')
          .select()
          .eq('orientation', 'portrait')
          .order('created_at', { ascending: false }),
        supabase
          .from('weather_backgrounds')
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

  const handleSelect = async (image: WeatherBackground) => {
    try {
      // Zuerst alle Bilder der gleichen Orientierung deselektieren
      const { error: updateError } = await supabase
        .from('weather_backgrounds')
        .update({ is_selected: false })
        .eq('orientation', image.orientation)

      if (updateError) throw updateError

      // Dann das ausgewählte Bild selektieren
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

  const handleUploadAll = async () => {
    try {
      const orientation = currentOrientation
      const setUploading = orientation === 'portrait' ? setIsPortraitUploading : setIsLandscapeUploading
      const bucket = orientation === 'portrait' ? PORTRAIT_BUCKET : LANDSCAPE_BUCKET
      
      setUploading(true)
      console.log('Starting upload to bucket:', bucket)

      for (const uploadFile of uploadFiles) {
        const file = uploadFile.file

        try {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast.error(`${file.name} ist kein Bild`)
            continue
          }

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} ist zu groß (max. ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
            continue
          }

          console.log(`Uploading ${file.name} to ${bucket}...`)
          
          // Generate unique filename to prevent conflicts
          const timestamp = Date.now()
          const uniqueFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          console.log('Generated unique filename:', uniqueFileName)

          // Upload to storage
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from(bucket)
            .upload(uniqueFileName, file, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) {
            console.error('Storage upload error:', uploadError)
            throw uploadError
          }

          console.log('File uploaded successfully, creating database entry...')

          // Prepare database entry
          const dbEntry = {
            file_name: file.name,
            bucket_name: bucket,
            orientation: orientation,
            storage_path: uniqueFileName,
            is_selected: false,
            created_at: new Date().toISOString()
          }

          console.log('Database entry to insert:', dbEntry)

          // Insert into database
          const { error: dbError, data: dbData } = await supabase
            .from('weather_backgrounds')
            .insert(dbEntry)

          if (dbError) {
            console.error('Database insert error:', dbError)
            // If database insert fails, try to clean up the uploaded file
            const { error: cleanupError } = await supabase.storage
              .from(bucket)
              .remove([uniqueFileName])
            
            if (cleanupError) {
              console.error('Failed to cleanup uploaded file:', cleanupError)
            }
            
            throw dbError
          }

          console.log('Database entry created:', dbData)

          // Update progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }))

          console.log(`${file.name} uploaded and registered successfully`)

        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error)
          if (error.code) console.error('Error code:', error.code)
          if (error.message) console.error('Error message:', error.message)
          if (error.details) console.error('Error details:', error.details)
          toast.error(`Fehler beim Hochladen von ${file.name}: ${error.message || 'Unbekannter Fehler'}`)
          continue
        }
      }

      await loadImages()
      setUploadFiles([])
      setUploadProgress({})
      setIsUploadDialogOpen(false)
      toast.success('Alle Bilder erfolgreich hochgeladen')
    } catch (error: any) {
      console.error('Error in handleUploadAll:', error)
      toast.error(`Fehler beim Hochladen der Bilder: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setIsPortraitUploading(false)
      setIsLandscapeUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Wetter Hintergründe</h1>
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
              {uploadFiles.map((uploadFile) => {
                const previewUrl = previewUrls[uploadFile.id]
                
                if (!previewUrl) {
                  const url = URL.createObjectURL(uploadFile.file)
                  setPreviewUrls(prev => ({
                    ...prev,
                    [uploadFile.id]: url
                  }))
                  return null
                }
                
                return (
                  <div key={uploadFile.id} className="relative group">
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        <Image
                          src={previewUrl}
                          alt={uploadFile.file.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      {uploadProgress[uploadFile.file.name] !== undefined && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="h-1 w-20 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${uploadProgress[uploadFile.file.name]}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id))
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrls(prev => {
                          const { [uploadFile.id]: _, ...rest } = prev
                          return rest
                        })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setUploadFiles([])
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                disabled={isPortraitUploading || isLandscapeUploading}
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
                      const newFiles = Array.from(files).map(file => ({
                        file,
                        id: Math.random().toString(36).substring(7),
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
            onUpload={(files) => {
              const newFiles = Array.from(files).map(file => ({
                file,
                id: Math.random().toString(36).substring(7),
                progress: 0
              }))
              setUploadFiles(newFiles)
              setCurrentOrientation('portrait')
              setIsUploadDialogOpen(true)
            }}
            isUploading={isPortraitUploading}
          />
        </div>

        {portraitImages.length === 0 ? (
          <EmptyState type="portrait" onUpload={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*'
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files
              if (files) {
                const newFiles = Array.from(files).map(file => ({
                  file,
                  id: Math.random().toString(36).substring(7),
                  progress: 0
                }))
                setUploadFiles(newFiles)
                setCurrentOrientation('portrait')
                setIsUploadDialogOpen(true)
              }
            }
            input.click()
          }} />
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
                Seite {portraitPage} von {Math.ceil(portraitImages.length / ITEMS_PER_PAGE)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPortraitPage(p => Math.min(Math.ceil(portraitImages.length / ITEMS_PER_PAGE), p + 1))}
                disabled={portraitPage === Math.ceil(portraitImages.length / ITEMS_PER_PAGE)}
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
            onUpload={(files) => {
              const newFiles = Array.from(files).map(file => ({
                file,
                id: Math.random().toString(36).substring(7),
                progress: 0
              }))
              setUploadFiles(newFiles)
              setCurrentOrientation('landscape')
              setIsUploadDialogOpen(true)
            }}
            isUploading={isLandscapeUploading}
          />
        </div>

        {landscapeImages.length === 0 ? (
          <EmptyState type="landscape" onUpload={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*'
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files
              if (files) {
                const newFiles = Array.from(files).map(file => ({
                  file,
                  id: Math.random().toString(36).substring(7),
                  progress: 0
                }))
                setUploadFiles(newFiles)
                setCurrentOrientation('landscape')
                setIsUploadDialogOpen(true)
              }
            }
            input.click()
          }} />
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
            {Math.ceil(landscapeImages.length / ITEMS_PER_PAGE) > 1 && (
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
                  Seite {landscapePage} von {Math.ceil(landscapeImages.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setLandscapePage(p => Math.min(Math.ceil(landscapeImages.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={landscapePage === Math.ceil(landscapeImages.length / ITEMS_PER_PAGE)}
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
