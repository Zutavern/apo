'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit, Trash2 } from 'lucide-react'

type NewsItem = {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const loadNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setNews(data)
  }

  useEffect(() => {
    loadNews()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentNews) {
      // Update
      const { error } = await supabase
        .from('news')
        .update({ title, content })
        .eq('id', currentNews.id)

      if (!error) {
        setIsEditing(false)
        setCurrentNews(null)
        await loadNews()
      }
    } else {
      // Create
      const { error } = await supabase
        .from('news')
        .insert([{ title, content }])

      if (!error) {
        setIsEditing(false)
        await loadNews()
      }
    }

    setTitle('')
    setContent('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nachrichten</h2>

      {/* News List */}
      <div className="grid gap-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentNews(item)
                    setTitle(item.title)
                    setContent(item.content)
                    setIsEditing(true)
                  }}
                  className="text-blue-500 hover:text-blue-400"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={async () => {
                    await supabase
                      .from('news')
                      .delete()
                      .eq('id', item.id)
                    await loadNews()
                  }}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-400">{item.content}</p>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {currentNews ? 'Nachricht bearbeiten' : 'Neue Nachricht'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Inhalt</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setCurrentNews(null)
                    setTitle('')
                    setContent('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 