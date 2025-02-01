'use client'

import { useState } from 'react'
import { Layout as LayoutIcon } from 'lucide-react'

interface HomepageData {
  hero: {
    title: string;
    subtitle: string;
  };
  features: {
    section1: {
      title: string;
      description: string;
    };
    section2: {
      title: string;
      description: string;
    };
  };
}

export default function HomepageManagementPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<HomepageData>({
    hero: {
      title: '',
      subtitle: ''
    },
    features: {
      section1: {
        title: '',
        description: ''
      },
      section2: {
        title: '',
        description: ''
      }
    }
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement save functionality
      console.log('Saving data:', data)
    } catch (error) {
      console.error('Error saving data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setData({
      hero: {
        title: '',
        subtitle: ''
      },
      features: {
        section1: {
          title: '',
          description: ''
        },
        section2: {
          title: '',
          description: ''
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutIcon className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-100">Homepage Verwaltung</h1>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6">
        {/* Hero Section Management */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Hero Bereich</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-100 mb-2">Hauptüberschrift</h3>
                <input
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100"
                  placeholder="Willkommen in Hohenmölsen"
                  value={data.hero.title}
                  onChange={(e) => setData({
                    ...data,
                    hero: { ...data.hero, title: e.target.value }
                  })}
                />
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-100 mb-2">Untertitel</h3>
                <input
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100"
                  placeholder="Entdecken Sie unsere Stadt"
                  value={data.hero.subtitle}
                  onChange={(e) => setData({
                    ...data,
                    hero: { ...data.hero, subtitle: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Feature Bereiche</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-100 mb-2">Bereich 1</h3>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100 mb-2"
                    placeholder="Titel"
                    value={data.features.section1.title}
                    onChange={(e) => setData({
                      ...data,
                      features: {
                        ...data.features,
                        section1: { ...data.features.section1, title: e.target.value }
                      }
                    })}
                  />
                  <textarea
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100"
                    placeholder="Beschreibung"
                    rows={3}
                    value={data.features.section1.description}
                    onChange={(e) => setData({
                      ...data,
                      features: {
                        ...data.features,
                        section1: { ...data.features.section1, description: e.target.value }
                      }
                    })}
                  />
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-100 mb-2">Bereich 2</h3>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100 mb-2"
                    placeholder="Titel"
                    value={data.features.section2.title}
                    onChange={(e) => setData({
                      ...data,
                      features: {
                        ...data.features,
                        section2: { ...data.features.section2, title: e.target.value }
                      }
                    })}
                  />
                  <textarea
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100"
                    placeholder="Beschreibung"
                    rows={3}
                    value={data.features.section2.description}
                    onChange={(e) => setData({
                      ...data,
                      features: {
                        ...data.features,
                        section2: { ...data.features.section2, description: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
            onClick={handleReset}
          >
            Zurücksetzen
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </div>
  )
} 