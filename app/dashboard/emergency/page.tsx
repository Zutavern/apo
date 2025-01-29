'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RefreshCw, Image as ImageIcon, Monitor, Table2, LayoutGrid, Columns, Rows, Map } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

interface Pharmacy {
  id: string
  robot_id: string
  robot_name: string
  task_id: string
  Position: string | null
  Apothekenname: string
  Notdiensttext: string | null
  Strasse: string | null
  PLZ: string | null
  Ort: string | null
  Telefon: string | null
  Entfernung: string | null
  distance_value: number | null
  maps_url: string | null
  qr_code_url: string | null
  qr_code_svg: string | null
  last_updated: string | null
}

type LayoutType = 'table' | 'single' | 'double' | 'triple'

export default function EmergencyPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')
  const [lastRunDate, setLastRunDate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const getItemsPerPage = () => {
    switch (layoutType) {
      case 'single':
        return 3
      case 'double':
        return 4
      case 'triple':
        return 6
      default:
        return 10 // für Tabellenansicht
    }
  }

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    console.log('🔄 Starte Laden der Apotheken-Daten...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('current_pharmacy_data')
        .select('*')
        .order('distance_value', { ascending: true });

      console.log('📊 Rohdaten von Supabase:', data);
      console.log('❌ Fehler von Supabase:', error);

      if (error) {
        console.error('🚨 Fehler beim Laden der Daten:', error);
        setError(error.message);
        return;
      }

      if (data) {
        console.log(`✅ ${data.length} Apotheken geladen`);
        data.forEach((pharmacy, index) => {
          console.log(`📍 Apotheke ${index + 1}:`, {
            name: pharmacy.Apothekenname,
            adresse: `${pharmacy.Strasse}, ${pharmacy.PLZ} ${pharmacy.Ort}`,
            entfernung: pharmacy.Entfernung,
            distance_value: pharmacy.distance_value,
            hat_qr: !!pharmacy.qr_code_svg,
            hat_maps_url: !!pharmacy.maps_url
          });
        });

        setPharmacies(data);
        const currentTime = new Date().toLocaleString('de-DE');
        setLastRunDate(currentTime);
        console.log('⏰ Daten aktualisiert um:', currentTime);
      } else {
        console.log('⚠️ Keine Daten empfangen');
        setPharmacies([]);
      }
    } catch (error: any) {
      console.error('🚨 Unerwarteter Fehler:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      console.log('✨ Laden der Daten abgeschlossen');
    }
  };

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'table') return 'single'
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'table'
    })
    setCurrentPage(1) // Zurück zur ersten Seite bei Layout-Wechsel
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'table':
        return <Table2 className="h-5 w-5" />
      case 'single':
        return <Rows className="h-5 w-5" />
      case 'double':
        return <Columns className="h-5 w-5" />
      case 'triple':
        return <LayoutGrid className="h-5 w-5" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'table':
        return 'Tabelle'
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
        return 'grid gap-6 grid-cols-1'
      case 'double':
        return 'grid gap-6 grid-cols-1 md:grid-cols-2'
      case 'triple':
        return 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return ''
    }
  }

  const generateMapsUrl = (pharmacy: Pharmacy): string => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(pharmacy.Strasse || '')},${encodeURIComponent(pharmacy.PLZ || '')} ${encodeURIComponent(pharmacy.Ort || '')}`;
    console.log('🗺️ Generierte Maps-URL:', url);
    return url;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-2">
        <h1 className="text-2xl font-bold text-gray-100">Notdienst-Apotheken</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
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
          <Link href="/public/emergency/portrait">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Portrait</span>
            </button>
          </Link>
          <Link href="/public/emergency/landscape">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Landscape</span>
            </button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : pharmacies.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Keine Apotheken gefunden
        </div>
      ) : layoutType === 'table' ? (
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
              {pharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">{pharmacy.Apothekenname}</td>
                  <td className="px-4 py-3">
                    {pharmacy.Strasse}<br />
                    {pharmacy.PLZ} {pharmacy.Ort}
                  </td>
                  <td className="px-4 py-3">{pharmacy.Telefon}</td>
                  <td className="px-4 py-3">{pharmacy.Entfernung}</td>
                  <td className="px-4 py-3">{pharmacy.Notdiensttext}</td>
                  <td className="px-4 py-3">
                    <div className="bg-white p-2 rounded-lg inline-block w-[100px] h-[100px] flex items-center justify-center">
                      <div 
                        dangerouslySetInnerHTML={{ __html: pharmacy.qr_code_svg || '' }} 
                        className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={getGridClass()}>
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex gap-6">
                <div className="bg-white p-2 rounded-lg w-[100px] h-[100px] flex items-center justify-center shrink-0">
                  <div 
                    dangerouslySetInnerHTML={{ __html: pharmacy.qr_code_svg }} 
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-100">{pharmacy.Apothekenname}</h3>
                  <p className="text-sm text-gray-400">
                    {pharmacy.Strasse}<br />
                    {pharmacy.PLZ} {pharmacy.Ort}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-400">Telefon:</span> {pharmacy.Telefon}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Notdienstinfo:</span><br />
                  {pharmacy.Notdiensttext}
                </p>
              </div>
              
              <div className="mt-4 flex justify-end">
                <span className="inline-block px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  {pharmacy.Entfernung}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
          disabled={pharmacies.length < getItemsPerPage()}
          className={`px-4 py-2 rounded-lg ${
            pharmacies.length < getItemsPerPage()
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