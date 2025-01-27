'use client'

import { useState, useEffect } from 'react'
import { Image, Monitor, LayoutGrid, Columns, Rows, RefreshCw, ChevronRight, Trash2, X, Check, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type LayoutType = 'single' | 'double' | 'triple'

type News = {
  id: string
  title: string
  description: string | null
  url: string
  image: string | null
  source: string
  category: string
  published_at: string
}

export default function NewsPage() {
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der News:', error)
        toast.error('Fehler beim Laden der News')
        return
      }

      setNews(data || [])
    } catch (error) {
      console.error('Fehler beim Laden der News:', error)
      toast.error('Fehler beim Laden der News')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (item: News) => {
    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('url', item.url)

      if (error) {
        console.error('Fehler beim Löschen der Nachricht:', error)
        toast.error('Fehler beim Löschen der Nachricht')
        return
      }

      setNews(prevNews => prevNews.filter(news => news.url !== item.url))
      toast.success('Nachricht erfolgreich gelöscht')
    } catch (error) {
      console.error('Fehler beim Löschen der Nachricht:', error)
      toast.error('Fehler beim Löschen der Nachricht')
    } finally {
      setDeleteId(null)
    }
  }

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
    setCurrentPage(1)
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="w-5 h-5" />
      case 'double':
        return <Columns className="w-5 h-5" />
      case 'triple':
        return <LayoutGrid className="w-5 h-5" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'single':
        return 'grid gap-4 grid-cols-1 max-w-4xl mx-auto'
      case 'double':
        return 'grid gap-4 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
      case 'triple':
        return 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto'
    }
  }

  const formattedDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const getItemsPerPage = () => {
    switch (layoutType) {
      case 'single':
        return 1
      case 'double':
        return 2
      case 'triple':
        return 3
    }
  }

  // Paging-Funktionen
  const itemsPerPage = getItemsPerPage()
  const totalPages = Math.ceil(news.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNews = news.slice(startIndex, endIndex)

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            News-Dashboard Hohenmölsen am {formattedDate}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Verwalten Sie hier die News-Anzeige
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <a
            href="/dashboard/news/api"
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            title="News API"
          >
            <RefreshCw className="h-5 w-5 text-blue-500" />
          </a>
          <a
            href="/dashboard/news/backgrounds"
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
          >
            <Image className="h-5 w-5 text-purple-500" />
          </a>
          <a
            href="/news/portrait"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
          >
            <Monitor className="h-5 w-5 text-green-500" />
            <span>Portrait</span>
          </a>
          <a
            href="/news/landscape"
            className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors"
          >
            <Monitor className="h-5 w-5 text-green-500" />
            <span>Landscape</span>
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Keine News vorhanden. Fügen Sie neue News über die News-API hinzu.
          </p>
        </div>
      ) : (
        <>
          <div className={getGridClass()}>
            {currentNews.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors"
              >
                {item.image && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <span className="px-2 py-1 bg-gray-700 rounded">
                      {item.source}
                    </span>
                    <span>
                      {new Date(item.published_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg mb-2 line-clamp-2 text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    {deleteId === item.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-2 text-green-500 hover:text-green-400"
                          title="Ja, löschen"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="inline-flex items-center gap-2 text-red-500 hover:text-red-400"
                          title="Nein, abbrechen"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="inline-flex items-center gap-2 text-red-500 hover:text-red-400"
                        title="Nachricht löschen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Vorherige Seite"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[2rem] h-8 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Nächste Seite"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 