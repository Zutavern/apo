import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Typen für die Allergie-Prognose
type PollenLevel = 'None' | 'Low' | 'Medium' | 'High';

interface AllergyForecast {
  location_id: number;
  forecast_date: string;
  alder_risk: PollenLevel;
  birch_risk: PollenLevel;
  hazel_risk: PollenLevel;
  oak_risk: PollenLevel;
  grass_risk: PollenLevel;
  mugwort_risk: PollenLevel;
  ragweed_risk: PollenLevel;
  air_quality_index: number;
  humidity_risk: boolean;
  wind_risk: boolean;
  overall_risk: PollenLevel;
  recommendations: string;
}

// Validierungsfunktion für die Allergie-Prognose
function validateAllergyForecast(data: any): AllergyForecast {
  const validLevels: PollenLevel[] = ['None', 'Low', 'Medium', 'High'];
  
  // Überprüfe alle Pollen-Risiko-Felder
  const pollenFields = [
    'alder_risk', 'birch_risk', 'hazel_risk', 'oak_risk',
    'grass_risk', 'mugwort_risk', 'ragweed_risk', 'overall_risk'
  ];

  for (const field of pollenFields) {
    if (!validLevels.includes(data[field])) {
      throw new Error(`Ungültiger Risikowert für ${field}: ${data[field]}`);
    }
  }

  // Überprüfe numerische Werte
  if (typeof data.air_quality_index !== 'number' || 
      data.air_quality_index < 0 || 
      data.air_quality_index > 500) {
    throw new Error('Ungültiger Luftqualitätsindex');
  }

  // Überprüfe Boolean-Werte
  if (typeof data.humidity_risk !== 'boolean' || 
      typeof data.wind_risk !== 'boolean') {
    throw new Error('Ungültige Risikofaktoren für Luftfeuchtigkeit oder Wind');
  }

  return data as AllergyForecast;
}

// Funktion zum Simulieren verschiedener Testfälle
async function simulateError(testCase: string | null): Promise<AllergyForecast> {
  // Basis-Testdaten
  const baseData: AllergyForecast = {
    location_id: 1,
    forecast_date: new Date().toISOString().split('T')[0],
    alder_risk: 'Low',
    birch_risk: 'Medium',
    hazel_risk: 'None',
    oak_risk: 'High',
    grass_risk: 'Medium',
    mugwort_risk: 'Low',
    ragweed_risk: 'None',
    air_quality_index: 75,
    humidity_risk: true,
    wind_risk: false,
    overall_risk: 'Medium',
    recommendations: 'Fenster morgens und abends schließen. Medikamente bereithalten.'
  };

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden');

    case 'invalid':
      return {
        ...baseData,
        alder_risk: 'Invalid' as PollenLevel, // Dies wird einen Validierungsfehler auslösen
      };

    case 'database':
      return {
        ...baseData,
        air_quality_index: 999999999, // Dies wird einen Datenbankfehler auslösen
      };

    default:
      return baseData;
  }
}

export async function GET(request: Request) {
  console.log('Starte Allergie-Prognose-Aktualisierung...');
  
  try {
    // Extrahiere Test-Parameter aus der URL
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Hole oder simuliere Daten
    const allergyData = await simulateError(testCase);

    // Validiere die Daten
    const validatedData = validateAllergyForecast(allergyData);
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Allergiedaten:', validatedData);

    // Speichere in der Datenbank
    const { error: dbError } = await supabase
      .from('allergy_forecast')
      .upsert(validatedData, {
        onConflict: 'location_id,forecast_date'
      });

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Allergie-Prognose erfolgreich aktualisiert',
      data: validatedData
    });

  } catch (error: any) {
    console.error('Fehler bei der Allergie-Prognose-Aktualisierung:', error);

    // Bestimme den HTTP-Status basierend auf der Fehlerart
    let status = 500;
    if (error.message.includes('Timeout')) status = 504;
    else if (error.message.includes('Validierung')) status = 422;
    else if (error.message.includes('Datenbankfehler')) status = 503;

    return NextResponse.json(
      {
        success: false,
        error: {
          type: error.message.includes('Timeout') ? 'API_TIMEOUT' :
                error.message.includes('Validierung') ? 'VALIDATION_ERROR' :
                error.message.includes('Datenbankfehler') ? 'DATABASE_ERROR' :
                'UNKNOWN_ERROR',
          message: error.message
        }
      },
      { status }
    );
  }
} 