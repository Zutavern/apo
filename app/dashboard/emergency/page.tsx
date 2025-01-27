'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RefreshCw, Image as ImageIcon, Monitor } from 'lucide-react'
import Link from 'next/link'

interface Pharmacy {
  id: string
  name: string
  street: string
  postal_code: string
  city: string
  phone: string
  distance: string
  emergency_service_text: string
  qr_code_svg: string
}

export default function EmergencyPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPharmacies()
  }, [currentPage])

  const fetchPharmacies = async () => {
    try {
      setIsLoading(true)
      
      let query = supabase
        .from('current_pharmacy_data')
        .select('*')
        .order('distance')

      const startIndex = (currentPage - 1) * itemsPerPage
      query = query.range(startIndex, startIndex + itemsPerPage - 1)

      const { data, error } = await query

      if (error) {
        console.error('Fehler beim Laden der Daten:', error)
        return
      }

      setPharmacies(data || [])
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Notdienst-Apotheken</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/emergency/api">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </button>
          </Link>
          <Link href="/dashboard/emergency/backgrounds">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
              <ImageIcon className="h-5 w-5 text-purple-500" />
            </button>
          </Link>
          <Link href="/emergency/portrait">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Portrait</span>
            </button>
          </Link>
          <Link href="/emergency/landscape">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Landscape</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Adresse</th>
              <th className="px-4 py-3 text-left">Telefon</th>
              <th className="px-4 py-3 text-left">Entfernung</th>
              <th className="px-4 py-3 text-left">Notdienstinfo</th>
              <th className="px-4 py-3 text-left">QR-Code</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center">
                  Lädt...
                </td>
              </tr>
            ) : pharmacies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center">
                  Keine Apotheken gefunden
                </td>
              </tr>
            ) : (
              pharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">{pharmacy.name}</td>
                  <td className="px-4 py-3">
                    {pharmacy.street}<br />
                    {pharmacy.postal_code} {pharmacy.city}
                  </td>
                  <td className="px-4 py-3">{pharmacy.phone}</td>
                  <td className="px-4 py-3">{pharmacy.distance}</td>
                  <td className="px-4 py-3">{pharmacy.emergency_service_text}</td>
                  <td className="px-4 py-3">
                    <div className="bg-white p-2 rounded-lg inline-block w-[100px] h-[100px] flex items-center justify-center">
                      <div 
                        dangerouslySetInnerHTML={{ __html: pharmacy.qr_code_svg }} 
                        className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${
            currentPage === 1
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          Zurück
        </button>
        <span className="px-4 py-2 bg-gray-800 rounded-lg">
          Seite {currentPage}
        </span>
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={pharmacies.length < itemsPerPage}
          className={`px-4 py-2 rounded-lg ${
            pharmacies.length < itemsPerPage
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          Weiter
        </button>
      </div>
    </div>
  )
} 