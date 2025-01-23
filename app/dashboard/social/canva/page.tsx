'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, FolderOpen } from 'lucide-react'
import { canvaClient, type CanvaAsset } from '@/lib/canva'

export default function CanvaAssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<CanvaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [folderId, setFolderId] = useState('')

  // Lade Assets aus einem Ordner
  const loadFolderAssets = async (id: string) => {
    setLoading(true)
    try {
      const folderAssets = await canvaClient.getFolderAssets(id)
      setAssets(folderAssets)
    } catch (error) {
      console.error('Fehler beim Laden der Assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Suche nach Assets
  const searchAssets = async (query: string) => {
    if (!query) return
    setLoading(true)
    try {
      const searchResults = await canvaClient.searchAssets(query)
      setAssets(searchResults)
    } catch (error) {
      console.error('Fehler bei der Suche:', error)
    } finally {
      setLoading(false)
    }
  }

  // Effekt für initiales Laden der Assets
  useEffect(() => {
    if (folderId) {
      loadFolderAssets(folderId)
    }
  }, [folderId])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => router.push('/dashboard/social')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Canva Assets</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nach Assets suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAssets(searchQuery)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ordner-ID eingeben..."
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Assets...</p>
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative group">
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center p-4">
                      <p className="font-medium mb-2">{asset.name}</p>
                      <Button 
                        size="sm"
                        onClick={() => window.open(asset.url, '_blank')}
                      >
                        Öffnen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Keine Assets gefunden. Geben Sie eine Ordner-ID ein oder suchen Sie nach Assets.
          </p>
        </div>
      )}
    </div>
  )
} 