import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Typen für die Pollendaten
type PollenLevel = 'None' | 'Low' | 'Medium' | 'High';

interface PollenData {
  location_id: number;
  timestamp: string;
  alder_pollen: PollenLevel;
  birch_pollen: PollenLevel;
  hazel_pollen: PollenLevel;
  oak_pollen: PollenLevel;
  grass_pollen: PollenLevel;
  mugwort_pollen: PollenLevel;
  ragweed_pollen: PollenLevel;
  dust_particles: number;
}

// Validierungsfunktion für die API-Antwort
function validatePollenResponse(data: any): data is PollenData {
  const requiredFields = [
    'alder_pollen',
    'birch_pollen',
    'hazel_pollen',
    'oak_pollen',
    'grass_pollen',
    'mugwort_pollen',
    'ragweed_pollen',
    'dust_particles'
  ];

  const validLevels: PollenLevel[] = ['None', 'Low', 'Medium', 'High'];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Fehlende oder ungültige Daten für ${field}`);
    }

    if (field !== 'dust_particles') {
      if (!validLevels.includes(data[field])) {
        throw new Error(`Ungültiger Pollenwert für ${field}: ${data[field]}`);
      }
    } else {
      if (typeof data[field] !== 'number' || isNaN(data[field])) {
        throw new Error(`Ungültiger Wert für dust_particles: ${data[field]}`);
      }
    }
  }

  return true;
}

// Funktion zum Simulieren verschiedener Testfälle
function simulateError(testCase: string): PollenData {
  const baseData: PollenData = {
    location_id: 1,
    timestamp: new Date().toISOString(),
    alder_pollen: 'None',
    birch_pollen: 'Low',
    hazel_pollen: 'Medium',
    oak_pollen: 'High',
    grass_pollen: 'Low',
    mugwort_pollen: 'None',
    ragweed_pollen: 'Medium',
    dust_particles: 15.5
  };

  switch (testCase) {
    case 'timeout':
      return new Promise((resolve) => {
        setTimeout(() => resolve(baseData), 6000);
      }) as any;

    case 'invalid':
      return {
        ...baseData,
        alder_pollen: 'Invalid' as PollenLevel // Ungültiger Wert
      };

    case 'database':
      return {
        ...baseData,
        dust_particles: 999999999 // Zu großer Wert für die Datenbank
      };

    default:
      return baseData;
  }
}

export async function GET(request: Request) {
  console.log('Starte Pollen-Aktualisierung...');
  
  try {
    // URL-Parameter für Testfälle auslesen
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Pollendaten abrufen (hier später die echte API-Abfrage)
    let pollenData: PollenData;
    
    if (testCase) {
      pollenData = await simulateError(testCase);
    } else {
      // Hier später die echte API-Abfrage implementieren
      pollenData = {
        location_id: 1,
        timestamp: new Date().toISOString(),
        alder_pollen: 'Low',
        birch_pollen: 'Medium',
        hazel_pollen: 'None',
        oak_pollen: 'Low',
        grass_pollen: 'High',
        mugwort_pollen: 'Medium',
        ragweed_pollen: 'None',
        dust_particles: 12.5
      };
    }

    // Daten validieren
    validatePollenResponse(pollenData);
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Pollendaten:', pollenData);

    // Daten in der Datenbank speichern
    const { error: dbError } = await supabase
      .from('pollen_data')
      .upsert([pollenData], {
        onConflict: 'location_id,timestamp'
      });

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Pollendaten erfolgreich aktualisiert',
      data: pollenData
    });

  } catch (error: any) {
    console.error('Fehler bei der Pollen-Aktualisierung:', error);
    
    const statusCode = error.message.includes('Timeout') ? 504 :
                      error.message.includes('Validierung') ? 422 :
                      error.message.includes('Datenbankfehler') ? 503 : 500;

    return NextResponse.json({
      success: false,
      error: {
        type: error.message.includes('Timeout') ? 'API_TIMEOUT' :
              error.message.includes('Validierung') ? 'VALIDATION_ERROR' :
              error.message.includes('Datenbankfehler') ? 'DATABASE_ERROR' : 'UNKNOWN_ERROR',
        message: error.message
      }
    }, { status: statusCode });
  }
} 