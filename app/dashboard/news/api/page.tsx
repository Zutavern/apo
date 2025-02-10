'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  RefreshCw, 
  Search, 
  Calendar, 
  Filter, 
  ChevronRight,
  Database 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface MediaStackNews {
  title: string
  description: string
  url: string
  image: string | null
  source: string
  category: string
  published_at: string
  copy?: boolean
}

type UsageInfo = {
  available: number
  current: number
  limit: number
}

export default function NewsApiPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [selectedMainSource, setSelectedMainSource] = useState('all')
  const [selectedRegionalSource, setSelectedRegionalSource] = useState('all')
  const [selectedSpecialSource, setSelectedSpecialSource] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [apiNews, setApiNews] = useState<MediaStackNews[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)

  const categories = [
    { value: 'general', label: 'Allgemeine Nachrichten' },
    { value: 'business', label: 'Wirtschaft' },
    { value: 'entertainment', label: 'Unterhaltung' },
    { value: 'health', label: 'Gesundheit' },
    { value: 'science', label: 'Wissenschaft' },
    { value: 'sports', label: 'Sport' },
    { value: 'technology', label: 'Technologie' }
  ]

  const mainSources = [
    { value: 'all', label: 'Große Portale' },
    { value: 'Deutsche Welle', label: 'Deutsche Welle' },
    { value: 'Focus', label: 'Focus' },
    { value: 'STERN', label: 'Stern' },
    { value: 'Tagesschau', label: 'Tagesschau' },
    { value: 'ZEIT', label: 'Zeit' },
    { value: 'faz', label: 'FAZ' },
    { value: 'n-tv', label: 'n-tv' },
    { value: 'ndr', label: 'NDR' },
    { value: 'mdr', label: 'MDR' }
  ]

  const regionalSources = [
    { value: 'all', label: 'Regionale Medien' },
    { value: 'Hamburger Abendblatt', label: 'Hamburger Abendblatt' },
    { value: 'dresden-fernsehen', label: 'Dresden Fernsehen' },
    { value: 'kreiszeitung', label: 'Kreiszeitung' },
    { value: 'hna', label: 'HNA' },
    { value: 'pnn', label: 'PNN' },
    { value: 'op-online', label: 'OP Online' }
  ]

  const specialSources = [
    { value: 'all', label: 'Spezielle Portale' },
    { value: 'golem', label: 'Golem (Tech)' },
    { value: 'finanznachrichten', label: 'Finanznachrichten' },
    { value: 'aktiencheck', label: 'Aktiencheck' },
    { value: 'promiflash', label: 'Promiflash' },
    { value: 'gala', label: 'Gala' }
  ]

  // Funktion zum Laden der Daten aus Supabase
  const loadNewsFromSupabase = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('api_news')
        .select('*', { count: 'exact' })
        .order('published_at', { ascending: false })

      // Kategorie Filter
      if (selectedCategory !== 'general') {
        query = query.eq('category', selectedCategory)
      }

      // Quellen Filter
      const selectedSources = []
      if (selectedMainSource !== 'all') selectedSources.push(selectedMainSource)
      if (selectedRegionalSource !== 'all') selectedSources.push(selectedRegionalSource)
      if (selectedSpecialSource !== 'all') selectedSources.push(selectedSpecialSource)
      
      if (selectedSources.length > 0) {
        query = query.in('source', selectedSources)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Fehler beim Laden der News aus Supabase:', error)
        return
      }

      if (data) {
        setApiNews(data)
        setTotalResults(count || data.length)
        setCurrentPage(1)
        
        // Extrahiere alle verfügbaren Quellen für den Filter
        const availableSources = Array.from(new Set(data.map(item => item.source)))
        setSourceFilter([]) // Reset source filter
      }
    } catch (error) {
      console.error('Fehler beim Laden der News aus Supabase:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNews = async () => {
    setIsLoading(true)
    try {
      // Basis-URL und Parameter
      const baseUrl = 'http://api.mediastack.com/v1/news'
      const params = new URLSearchParams({
        access_key: '265fb76082b343ff36fb0eb3591f24da',
        countries: 'de',
        languages: 'de',
        limit: '100'
      })

      // Kategorie hinzufügen
      if (selectedCategory !== 'general') {
        params.append('categories', selectedCategory)
      }

      // Quellen zusammenstellen
      const selectedSources = []
      if (selectedMainSource !== 'all') selectedSources.push(selectedMainSource)
      if (selectedRegionalSource !== 'all') selectedSources.push(selectedRegionalSource)
      if (selectedSpecialSource !== 'all') selectedSources.push(selectedSpecialSource)
      
      if (selectedSources.length > 0) {
        params.append('sources', selectedSources.join(','))
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`)
      const data = await response.json()

      if (data.data) {
        // Daten für Supabase vorbereiten
        const newsItems = data.data.map((item: MediaStackNews) => ({
          title: item.title?.trim() || 'Kein Titel',
          description: item.description?.trim() || null,
          url: item.url?.trim() || '',
          image: item.image?.trim() || null,
          source: item.source?.trim() || 'Unbekannte Quelle',
          category: item.category?.trim() || selectedCategory || 'general',
          published_at: new Date(item.published_at).toISOString(),
          copy: false
        }))

        // Filtere ungültige Einträge
        const validNewsItems = newsItems.filter(item => 
          item.url && 
          item.url.length > 0 && 
          item.title && 
          item.title.length > 0 &&
          item.title !== 'Kein Titel'
        )

        console.log('Bereite vor zum Speichern:', {
          beispielItem: validNewsItems[0],
          anzahlItems: validNewsItems.length,
          ungültigeItems: newsItems.length - validNewsItems.length
        })

        if (validNewsItems.length === 0) {
          console.error('Keine gültigen News-Items zum Speichern gefunden')
          return
        }

        try {
          // Speichere die Daten in Batches von 50 Items
          const batchSize = 50
          for (let i = 0; i < validNewsItems.length; i += batchSize) {
            const batch = validNewsItems.slice(i, i + batchSize)
            const { error } = await supabase
              .from('api_news')
              .upsert(batch, {
                onConflict: 'url',
                ignoreDuplicates: true
              })

            if (error) {
              console.error('Fehler beim Speichern von Batch', i / batchSize + 1, ':', error)
            } else {
              console.log('Batch', i / batchSize + 1, 'erfolgreich gespeichert:', {
                start: i + 1,
                end: Math.min(i + batchSize, validNewsItems.length),
                total: validNewsItems.length
              })
            }
          }

          // Lade die Daten aus Supabase nach erfolgreichem Speichern
          await loadNewsFromSupabase()
        } catch (error) {
          console.error('Fehler beim Speichervorgang:', error)
        }
      }

      // Nach erfolgreichem Abruf die API-Nutzung aktualisieren
      await checkApiUsage()
    } catch (error) {
      console.error('Fehler beim Laden der News:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkApiUsage = async () => {
    try {
      const response = await fetch(`http://api.mediastack.com/v1/usage?access_key=265fb76082b343ff36fb0eb3591f24da`)
      const data = await response.json()
      
      if (data.usage) {
        setUsageInfo({
          available: data.usage.limit - data.usage.current,
          current: data.usage.current,
          limit: data.usage.limit
        })
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der API-Nutzung:', error)
    }
  }

  // Effekt für initiales Laden und bei Änderung der Filter
  useEffect(() => {
    loadNewsFromSupabase()
  }, [selectedCategory, selectedMainSource, selectedRegionalSource, selectedSpecialSource])

  // Effekt für API-Nutzung beim ersten Laden
  useEffect(() => {
    checkApiUsage()
  }, [])

  // Angepasste Filterfunktion für Supabase-Daten
  const filterNews = (news: MediaStackNews[]) => {
    return news.filter(item => {
      // Textsuche
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())) {
        return false
      }

      // Datumsfilter
      if (dateFilter !== 'all') {
        const publishDate = new Date(item.published_at)
        const now = new Date()
        const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 3600 * 24)

        if (dateFilter === 'today' && daysDiff > 1) return false
        if (dateFilter === 'week' && daysDiff > 7) return false
        if (dateFilter === 'month' && daysDiff > 30) return false
      }

      // Quellenfilter
      if (sourceFilter.length > 0 && !sourceFilter.includes(item.source)) {
        return false
      }

      return true
    })
  }

  // Paginierte und gefilterte News
  const getDisplayedNews = () => {
    const filtered = filterNews(apiNews)
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filtered.slice(start, end)
  }

  // Funktion zum Kopieren/Löschen einer Nachricht in der news Tabelle
  const toggleNews = async (item: MediaStackNews) => {
    try {
      if (!item.copy) {
        // Prüfe ob das Bild erreichbar ist
        let validImage = item.image;
        if (item.image) {
          try {
            const response = await fetch(item.image, { method: 'HEAD' });
            if (!response.ok) {
              validImage = null;
            }
          } catch (error) {
            console.log('Bild nicht erreichbar:', item.image);
            validImage = null;
          }
        }

        // Kopiere in news Tabelle
        const { error: insertError } = await supabase
          .from('news')
          .insert({
            title: item.title || '',
            description: item.description || '',
            url: item.url || '',
            image: validImage,
            source: item.source || '',
            category: item.category || 'general',
            published_at: new Date(item.published_at).toISOString()
          })

        if (insertError) {
          console.error('Fehler beim Kopieren der Nachricht:', insertError)
          toast.error('Fehler beim Speichern der Nachricht')
          throw insertError
        }

        // Setze copy Flag in api_news auf true
        const { error: updateError } = await supabase
          .from('api_news')
          .update({ copy: true })
          .eq('url', item.url)

        if (updateError) {
          console.error('Fehler beim Aktualisieren des copy Flags:', updateError)
          throw updateError
        }

        toast.success('Nachricht erfolgreich gespeichert')
      } else {
        // Lösche aus news Tabelle
        const { error: deleteError } = await supabase
          .from('news')
          .delete()
          .eq('url', item.url)

        if (deleteError) {
          console.error('Fehler beim Löschen der Nachricht:', deleteError)
          toast.error('Fehler beim Löschen der Nachricht')
          throw deleteError
        }

        // Setze copy Flag in api_news auf false
        const { error: updateError } = await supabase
          .from('api_news')
          .update({ copy: false })
          .eq('url', item.url)

        if (updateError) {
          console.error('Fehler beim Aktualisieren des copy Flags:', updateError)
          throw updateError
        }

        toast.success('Nachricht erfolgreich entfernt')
      }

      // Aktualisiere die UI
      setApiNews(prevNews => 
        prevNews.map(news => 
          news.url === item.url 
            ? { ...news, copy: !news.copy }
            : news
        )
      )
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Nachricht:', error)
      toast.error('Ein Fehler ist aufgetreten')
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/news')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-300"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Zurück</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Nachrichten aus APIs</h1>
        </div>
        {usageInfo && (
          <div className="text-sm text-gray-400">
            <span className="text-blue-500 font-medium">{usageInfo.available}</span>
            <span className="text-gray-500">/</span>
            <span>{usageInfo.limit}</span>
          </div>
        )}
      </div>

      {/* MediaStack API Controls */}
      <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedMainSource}
            onChange={(e) => setSelectedMainSource(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mainSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>

          <select
            value={selectedRegionalSource}
            onChange={(e) => setSelectedRegionalSource(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {regionalSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSpecialSource}
            onChange={(e) => setSelectedSpecialSource(e.target.value)}
            className="bg-gray-900 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {specialSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Lädt...' : 'Nachrichten abrufen'}</span>
          </button>
        </div>
      </div>

      {/* Neue Ergebnisfilter */}
      {apiNews.length > 0 && (
        <>
          <div className="mb-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              {/* Suchfeld */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nachrichten durchsuchen..."
                  className="w-full bg-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                />
              </div>

              {/* Datum Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 appearance-none"
                >
                  <option value="all">Alle Daten</option>
                  <option value="today">Heute</option>
                  <option value="week">Letzte Woche</option>
                  <option value="month">Letzter Monat</option>
                </select>
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Quellen Filter */}
              <div className="relative">
                <select
                  multiple
                  value={sourceFilter}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value)
                    setSourceFilter(values)
                  }}
                  className="bg-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 min-w-[200px] max-h-32"
                >
                  {Array.from(new Set(apiNews.map(item => item.source))).map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Anzahl pro Seite */}
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
              >
                <option value={10}>10 pro Seite</option>
                <option value={25}>25 pro Seite</option>
                <option value={50}>50 pro Seite</option>
              </select>
            </div>
          </div>

          {/* Ergebnis-Statistiken */}
          <div className="text-sm text-gray-400 mb-4">
            {isLoading ? (
              <span>Lade Ergebnisse...</span>
            ) : (
              apiNews.length > 0 ? (
                <span>
                  Zeige {Math.min((currentPage - 1) * itemsPerPage + 1, totalResults)}-
                  {Math.min(currentPage * itemsPerPage, totalResults)} von {totalResults} Ergebnissen
                </span>
              ) : (
                <span>Keine Nachrichten gefunden</span>
              )
            )}
          </div>
        </>
      )}

      {/* News Cards */}
      {apiNews.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {getDisplayedNews().map((item, index) => (
            <div
              key={index}
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
                <h3 className="font-medium text-lg mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400"
                  >
                    Weiterlesen
                    <ChevronRight className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleNews(item)}
                    className={`${
                      item.copy 
                        ? 'text-blue-500 hover:text-blue-400' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    title={item.copy ? 'Aus News entfernen' : 'In News kopieren'}
                  >
                    <Database className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          Klicken Sie auf "Nachrichten abrufen" um die neuesten Nachrichten zu laden.
        </div>
      )}

      {/* Pagination */}
      {apiNews.length > 0 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title={currentPage === 1 ? "Erste Seite" : `Zurück zu Seite ${currentPage - 1}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {(() => {
              const totalPages = Math.ceil(filterNews(apiNews).length / itemsPerPage)
              const pages = []
              
              // Immer Seite 1 anzeigen
              if (totalPages > 0) {
                pages.push(1)
              }
              
              // Ellipsis vor der aktuellen Seite
              if (currentPage > 4) {
                pages.push('...')
              }
              
              // Seiten um die aktuelle Seite
              for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
                pages.push(i)
              }
              
              // Ellipsis nach der aktuellen Seite
              if (currentPage < totalPages - 3) {
                pages.push('...')
              }
              
              // Immer letzte Seite anzeigen
              if (totalPages > 1) {
                pages.push(totalPages)
              }
              
              return pages.map((page, index) => (
                typeof page === 'number' ? (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[2rem] h-8 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="text-gray-600">
                    {page}
                  </span>
                )
              ))
            })()}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filterNews(apiNews).length / itemsPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(filterNews(apiNews).length / itemsPerPage)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title={currentPage === Math.ceil(filterNews(apiNews).length / itemsPerPage) ? "Letzte Seite" : `Weiter zu Seite ${currentPage + 1}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
} 