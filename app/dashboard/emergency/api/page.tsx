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
  id: string
  Position: string
  Apothekenname: string
  Notdiensttext: string
  Strasse: string
  PLZ: string
  Ort: string
  Telefon: string
  Entfernung: string
  maps_url: string
  qr_code_svg: string
}

type LayoutType = 'single' | 'double' | 'triple' | 'table'

export default function EmergencyApiPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRunDate, setLastRunDate] = useState<string | null>(null)
  const [layoutType, setLayoutType] = useState<LayoutType>('triple')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data: dbData, error: dbError } = await supabase
          .from('current_pharmacy_data')
          .select('*')
          .order('distance_value', { ascending: true })

        if (dbError) {
          console.error('Datenbankfehler:', dbError)
          throw new Error(`Datenbankfehler: ${dbError.message}`)
        }

        if (!dbData || dbData.length === 0) {
          setPharmacies([])
          setError('Keine Apotheken gefunden')
          return
        }

        const pharmacyData = dbData.map(item => ({
          id: item.id,
          Position: item.Position || '',
          Apothekenname: item.Apothekenname || '',
          Notdiensttext: item.Notdiensttext || '',
          Strasse: item.Strasse || '',
          PLZ: item.PLZ || '',
          Ort: item.Ort || '',
          Telefon: item.Telefon || '',
          Entfernung: item.Entfernung || '',
          maps_url: item.maps_url || '',
          qr_code_svg: item.qr_code_svg || ''
        }))

        setPharmacies(pharmacyData)
        if (dbData[0]?.task_created_at) {
          setLastRunDate(new Date(dbData[0].task_created_at).toLocaleString('de-DE'))
        }
      } catch (error: any) {
        console.error('Fehler beim Laden der initialen Daten:', error)
        setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten')
        setPharmacies([])
      } finally {
        setIsLoading(false)
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

          // Extrahiere den numerischen Wert der Entfernung für die Sortierung
          let distance_value = null;
          try {
            const distanceMatch = pharmacy.Entfernung.match(/:\s*(\d+(\.\d+)?)/);
            distance_value = distanceMatch ? parseFloat(distanceMatch[1]) : null;
          } catch (error) {
            console.error('Fehler beim Parsen der Entfernung:', error);
          }

          return {
            robot_id: robotId,
            robot_name: robotName,
            task_id: taskId,
            task_created_at: new Date(taskCreatedAt).toISOString(),
            "Position": pharmacy.Position || '',
            "Apothekenname": pharmacy.Apothekenname || '',
            "Notdiensttext": pharmacy.Notdiensttext || '',
            "Strasse": pharmacy.Strasse || '',
            "PLZ": pharmacy.PLZ || '',
            "Ort": pharmacy.Ort || '',
            "Telefon": pharmacy.Telefon || '',
            "Entfernung": pharmacy.Entfernung || '',
            distance_value: distance_value,
            maps_url: mapsUrl,
            qr_code_url: mapsUrl,
            qr_code_svg: qrCodeSvg,
            last_updated: new Date().toISOString(),
            user_id: null
          };
      }));

      console.log('Daten vorbereitet:', pharmacyData[0]);

      // Lösche ALLE alten Daten
      const { error: deleteError } = await supabase
        .from('current_pharmacy_data')
        .delete()
        .not('id', 'is', null);

      if (deleteError) {
        console.error('Fehler beim Löschen alter Daten:', deleteError);
        throw deleteError;
      }

      // Füge die neuen Daten in einem Batch ein
      const { data, error: insertError } = await supabase
        .from('current_pharmacy_data')
        .insert(pharmacyData)
        .select();

      if (insertError) {
        console.error('Fehler beim Einfügen neuer Daten:', insertError);
        throw insertError;
      }

      console.log(`${pharmacyData.length} Apotheken erfolgreich gespeichert. Erste gespeicherte Apotheke:`, data?.[0]);
      
      return data;
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

      console.log('Robot gefunden:', notdienstRobot.name);

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
      console.log('Rohe API-Daten:', latestTask.capturedLists.Notdienst);

      const pharmacyData = latestTask.capturedLists.Notdienst
        .filter((pharmacy: any) => pharmacy.Apothekenname && pharmacy.Strasse) // Nur gültige Einträge
        .map((pharmacy: any, index: number) => ({
          id: `${latestTask.id}_${index}`,
          Position: pharmacy.Position || '',
          Apothekenname: pharmacy.Apothekenname || '',
          Notdiensttext: pharmacy.Notdiensttext || '',
          Strasse: pharmacy.Strasse || '',
          PLZ: pharmacy.PLZ || '',
          Ort: pharmacy.Ort || '',
          Telefon: pharmacy.Telefon || '',
          Entfernung: pharmacy.Entfernung || ''
        }));

      console.log('Verarbeitete Apotheken-Daten:', pharmacyData);

      // Sortiere nach Entfernung
      const sortedPharmacies = pharmacyData
        .filter(pharmacy => pharmacy.Apothekenname && pharmacy.Strasse) // Nochmalige Filterung
        .sort((a, b) => {
          if (!a.Entfernung) return 1
          if (!b.Entfernung) return -1
          
          try {
            const distA = parseFloat(a.Entfernung.split(': ')[1]?.split(' ')[0] || '0')
            const distB = parseFloat(b.Entfernung.split(': ')[1]?.split(' ')[0] || '0')
            return distA - distB
          } catch (error) {
            console.error('Fehler beim Parsen der Entfernung:', error)
            return 0
          }
        });

      console.log('Sortierte und gefilterte Apotheken:', sortedPharmacies);

      // Speichere in Datenbank und setze die gespeicherten Daten
      const savedData = await savePharmacyData(
        sortedPharmacies,
        notdienstRobot.id,
        notdienstRobot.name,
        latestTask.id,
        latestTask.createdAt
      );

      if (savedData) {
        console.log('Gespeicherte Daten:', savedData);
        setPharmacies(savedData);
        const currentTime = new Date().toLocaleString('de-DE');
        setLastRunDate(currentTime);
        setError(null);
      }
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

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {!isLoading && !error && pharmacies.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Keine Apotheken im Notdienst gefunden
        </div>
      )}

      {!isLoading && !error && pharmacies.length > 0 && (
        <>
          <div className="text-gray-300 mb-4">
            Notdienst-Apotheken vom letzten Durchlauf ({lastRunDate || 'Unbekannt'}), sortiert nach Entfernung:
          </div>
          <div className={getGridClass()}>
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{pharmacy.Apothekenname}</h3>
                <div className="space-y-2 text-gray-300">
                  <a 
                    href={pharmacy.maps_url} 
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
                        value={pharmacy.maps_url || generateMapsUrl(pharmacy)}
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
            ))}
          </div>
        </>
      )}
    </div>
  )
} 
