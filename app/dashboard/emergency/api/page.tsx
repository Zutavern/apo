'use client'

import { 
  Home, 
  Calendar, 
  Image as ImageIcon, 
  AlertTriangle,
  LogOut,
  Settings,
  RefreshCw,
  Map,
  Rows,
  Columns,
  LayoutGrid,
  XCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactDOM from 'react-dom'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface Pharmacy {
  Position: string
  Apothekenname: string
  Notdiensttext: string
  Strasse: string
  PLZ: string
  Ort: string
  Telefon: string
  Entfernung: string
  maps_url?: string
  qr_code_svg?: string
}

type LayoutType = 'single' | 'double' | 'triple'

export default function EmergencyApiPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRunDate, setLastRunDate] = useState<string | null>(null)
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('current_pharmacy_data')
          .select('*')
          .order('distance')

        if (dbError) throw dbError

        if (dbData && dbData.length > 0) {
          const pharmacyData = dbData.map(item => ({
            Position: item.position,
            Apothekenname: item.name,
            Notdiensttext: item.emergency_service_text,
            Strasse: item.street,
            PLZ: item.postal_code,
            Ort: item.city,
            Telefon: item.phone,
            Entfernung: item.distance,
            maps_url: item.maps_url,
            qr_code_svg: item.qr_code_svg
          }))
          setPharmacies(pharmacyData)
          setLastRunDate(new Date(dbData[0].task_created_at).toLocaleString('de-DE'))
        }
      } catch (error) {
        console.error('Fehler beim Laden der initialen Daten:', error)
      }
    }

    loadInitialData()
  }, [])

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="h-5 w-5 text-blue-500" />
      case 'double':
        return <Columns className="h-5 w-5 text-blue-500" />
      case 'triple':
        return <LayoutGrid className="h-5 w-5 text-blue-500" />
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
        return 'grid grid-cols-1 gap-6'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  const generateMapsUrl = (pharmacy: Pharmacy) => {
    const address = `${pharmacy.Strasse}, ${pharmacy.PLZ} ${pharmacy.Ort}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const savePharmacyData = async (pharmacies: any[], robotId: string, robotName: string, taskId: string, taskCreatedAt: string) => {
    try {
      console.log('Starte Speichervorgang...');
      console.log('Anzahl der Apotheken:', pharmacies.length);
      
      // Lösche alle vorhandenen Daten ohne Bedingung
      const { error: deleteError } = await supabase
        .from('current_pharmacy_data')
        .delete()
        .not('id', 'is', null);

      if (deleteError) {
        console.error('Fehler beim Löschen alter Daten:', deleteError);
        throw deleteError;
      }
      
      console.log('Alte Daten erfolgreich gelöscht');

      // Bereite die neuen Daten vor
      const pharmacyData = await Promise.all(pharmacies.map(async (pharmacy, index) => {
        // Generiere Maps URL
        const address = `${pharmacy.Strasse}, ${pharmacy.PLZ} ${pharmacy.Ort}`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        
        // Generiere QR Code SVG als String
        const qrCodeSvg = await QRCode.toString(mapsUrl, {
          type: 'svg',
          width: 150,
          margin: 1,
          errorCorrectionLevel: 'M'
        });

        return {
          robot_id: robotId,
          robot_name: robotName,
          task_id: taskId,
          task_created_at: new Date(taskCreatedAt).toISOString(),
          position: pharmacy.Position,
          name: pharmacy.Apothekenname,
          street: pharmacy.Strasse,
          postal_code: pharmacy.PLZ,
          city: pharmacy.Ort,
          phone: pharmacy.Telefon,
          distance: pharmacy.Entfernung,
          emergency_service_text: pharmacy.Notdiensttext,
          maps_url: mapsUrl,
          qr_code_svg: qrCodeSvg
        };
      }));

      console.log('Daten vorbereitet:', pharmacyData[0]);

      // Füge neue Daten ein
      const { data, error: insertError } = await supabase
        .from('current_pharmacy_data')
        .insert(pharmacyData)
        .select();

      if (insertError) {
        console.error('Fehler beim Einfügen neuer Daten:', insertError);
        throw insertError;
      }

      // Aktualisiere den Zeitstempel nach erfolgreicher Speicherung
      const currentTime = new Date().toLocaleString('de-DE');
      setLastRunDate(currentTime);

      console.log(`${pharmacyData.length} Apotheken erfolgreich gespeichert. Erste gespeicherte Apotheke:`, data?.[0]);
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
      throw error;
    }
  };

  const fetchPharmacyData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiKey = process.env.NEXT_PUBLIC_BROWSE_AI_API_KEY
      if (!apiKey) {
        throw new Error('API-Schlüssel fehlt')
      }

      // Hole zuerst den Notdienst-Robot
      const robotsResponse = await fetch('https://api.browse.ai/v2/robots', {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      })

      if (!robotsResponse.ok) {
        throw new Error(`HTTP error! status: ${robotsResponse.status}`)
      }

      const robotsData = await robotsResponse.json()
      const notdienstRobot = robotsData.robots.items.find(
        (robot: any) => robot.name.toLowerCase().includes('notdienst')
      )

      if (!notdienstRobot) {
        throw new Error('Notdienst-Robot nicht gefunden')
      }

      // Hole die letzten erfolgreichen Tasks
      const tasksResponse = await fetch(`https://api.browse.ai/v2/robots/${notdienstRobot.id}/tasks?status=successful&pageSize=1&sort=-createdAt`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      })

      if (!tasksResponse.ok) {
        throw new Error(`HTTP error! status: ${tasksResponse.status}`)
      }

      const tasksData = await tasksResponse.json()
      
      if (!tasksData.result?.robotTasks?.items?.[0]?.capturedLists?.Notdienst) {
        throw new Error('Keine Apotheken-Daten gefunden')
      }

      // Extrahiere die Apotheken-Daten aus dem neuesten Task
      const latestTask = tasksData.result.robotTasks.items[0]
      const pharmacyData = latestTask.capturedLists.Notdienst.map((pharmacy: any) => ({
        Position: pharmacy.Position,
        Apothekenname: pharmacy.Apothekenname,
        Notdiensttext: pharmacy.Notdiensttext,
        Strasse: pharmacy.Strasse,
        PLZ: pharmacy.PLZ,
        Ort: pharmacy.Ort,
        Telefon: pharmacy.Telefon,
        Entfernung: pharmacy.Entfernung
      }))

      // Sortiere nach Entfernung
      const sortedPharmacies = pharmacyData.sort((a, b) => {
        const distA = parseFloat(a.Entfernung.split(': ')[1].split(' ')[0])
        const distB = parseFloat(b.Entfernung.split(': ')[1].split(' ')[0])
        return distA - distB
      })

      // Speichere in Datenbank
      await savePharmacyData(
        sortedPharmacies,
        notdienstRobot.id,
        notdienstRobot.name,
        latestTask.id,
        latestTask.createdAt
      )

      setPharmacies(sortedPharmacies)
      const currentTime = new Date().toLocaleString('de-DE')
      setLastRunDate(currentTime)
      setError(null)
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Daten:', error)
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/emergency"
          className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Notdienst API</h1>
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <button
            onClick={fetchPharmacyData} 
            disabled={isLoading}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Neue Daten abrufen"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {pharmacies.length > 0 && (
          <>
            <div className="text-gray-300 mb-4">
              Notdienst-Apotheken vom letzten Durchlauf ({lastRunDate}), sortiert nach Entfernung:
            </div>
            <div className={getGridClass()}>
              {pharmacies.map((pharmacy) => {
                const mapsUrl = pharmacy.maps_url || generateMapsUrl(pharmacy)
                return (
                  <div key={pharmacy.Position} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">{pharmacy.Apothekenname}</h3>
                    <div className="space-y-2 text-gray-300">
                      <a 
                        href={mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block hover:text-blue-400 transition-colors flex items-start gap-2"
                      >
                        <Map className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                          <p>{pharmacy.Strasse}</p>
                          <p>{pharmacy.PLZ} {pharmacy.Ort}</p>
                          <p className="text-sm text-blue-400">In Google Maps öffnen</p>
                        </div>
                      </a>
                      <div className="mt-4 bg-white p-2 rounded-lg inline-block">
                        {pharmacy.qr_code_svg ? (
                          <div dangerouslySetInnerHTML={{ __html: pharmacy.qr_code_svg }} />
                        ) : (
                          <QRCodeSVG
                            value={mapsUrl}
                            size={150}
                            level="M"
                            includeMargin={true}
                          />
                        )}
                      </div>
                      <p>Tel: {pharmacy.Telefon}</p>
                      <p className="text-sm text-blue-400">{pharmacy.Entfernung}</p>
                      <p className="text-sm text-gray-400">{pharmacy.Notdiensttext}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 
