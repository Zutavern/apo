'use client'

import { useState, useEffect } from 'react'
import { Monitor, ChartBar, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const medicineData = [
  {
    id: 1,
    name: 'Aspirin',
    description: 'Willkommen im WKZ Digital Signage System. Hier können Sie Ihre digitalen Anzeigetafeln verwalten, Inhalte steuern und detaillierte Leistungsanalysen durchführen.'
  },
  {
    id: 2,
    name: 'Voltaren',
    description: 'Verwalten Sie Ihre Voltaren-Kampagne und analysieren Sie die Performance über alle digitalen Displays in Echtzeit.'
  },
  {
    id: 3,
    name: 'Bepanthen',
    description: 'Steuern Sie die Bepanthen-Kampagne und optimieren Sie die Reichweite Ihrer Werbebotschaften mit unserem Digital Signage System.'
  },
  {
    id: 4,
    name: 'Thomapyrin',
    description: 'Maximieren Sie die Wirkung Ihrer Thomapyrin-Kampagne durch gezielte Ausspielung auf allen digitalen Displays.'
  },
  {
    id: 5,
    name: 'Dolormin',
    description: 'Nutzen Sie die volle Bandbreite unseres Digital Signage Systems für Ihre Dolormin-Kampagne und erreichen Sie Ihre Zielgruppe effektiv.'
  },
  {
    id: 6,
    name: 'Ibuprofen',
    description: 'Steuern Sie Ihre Ibuprofen-Kampagne präzise und analysieren Sie die Performance in Echtzeit über unser Dashboard.'
  }
]

export default function ElacPage() {
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 2
  const totalPages = Math.ceil(medicineData.length / itemsPerPage)
  
  useEffect(() => {
    const campaign = searchParams.get('campaign')
    if (campaign) {
      const campaignId = parseInt(campaign, 10)
      const campaignIndex = medicineData.findIndex(med => med.id === campaignId)
      if (campaignIndex !== -1) {
        setCurrentPage(Math.floor(campaignIndex / itemsPerPage) + 1)
      }
    }
  }, [searchParams])

  // Berechne die aktuell anzuzeigenden Karten
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = medicineData.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4 px-4">WKZ Digital</h1>
      <div className="max-w-7xl mx-auto px-4">
        {/* Karten */}
        {currentItems.map((medicine) => (
          <div key={medicine.id} className="mb-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 px-6 py-4">{medicine.name}</h2>
              </div>
              
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 h-[200px] bg-gray-100 flex items-center justify-center">
                  <Monitor className="h-16 w-16 text-gray-300" />
                </div>
                
                <div className="lg:w-1/2 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    WKZ Digital Signage System
                  </h2>
                  <p className="text-gray-600 mb-4 text-sm">
                    {medicine.description}
                  </p>
                  
                  <Link
                    href={`/dashboard/elac/kpi?campaign=${medicine.id}`}
                    className="block"
                  >
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
                      <div className="flex items-center gap-3 mb-2">
                        <ChartBar className="h-5 w-5 text-primary" />
                        <h3 className="font-medium text-gray-900">KPI Dashboard</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Detaillierte Leistungsübersicht und Statistiken für Ihre Kampagne
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Paging */}
        <div className="flex justify-center items-center gap-4 mt-8 mb-8">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border ${
              currentPage === 1 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border ${
              currentPage === totalPages 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
} 