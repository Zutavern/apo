import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface für die Gesundheitsindices
interface HealthIndices {
  location_id: number;
  forecast_date: string;
  cold_risk: number;
  asthma_risk: number;
  migraine_risk: number;
  joint_pain_risk: number;
  temperature_stress: boolean;
  humidity_stress: boolean;
  pressure_stress: boolean;
  recommendations: string;
}

// Validierungsfunktion für die Gesundheitsindices
function validateHealthIndices(data: any): HealthIndices {
  // Überprüfe Risikowerte (0-10)
  const riskFields = ['cold_risk', 'asthma_risk', 'migraine_risk', 'joint_pain_risk'];
  
  for (const field of riskFields) {
    const value = data[field];
    if (typeof value !== 'number' || value < 0 || value > 10 || !Number.isInteger(value)) {
      throw new Error(`Ungültiger Risikowert für ${field}: ${value}. Muss eine ganze Zahl zwischen 0 und 10 sein.`);
    }
  }

  // Überprüfe Boolean-Werte
  const stressFields = ['temperature_stress', 'humidity_stress', 'pressure_stress'];
  for (const field of stressFields) {
    if (typeof data[field] !== 'boolean') {
      throw new Error(`Ungültiger Stressfaktor für ${field}: ${data[field]}`);
    }
  }

  // Überprüfe Pflichtfelder
  if (!data.location_id || !data.forecast_date) {
    throw new Error('Fehlende Pflichtfelder: location_id oder forecast_date');
  }

  if (typeof data.recommendations !== 'string' || data.recommendations.length === 0) {
    throw new Error('Fehlende oder ungültige Empfehlungen');
  }

  return data as HealthIndices;
}

// Funktion zum Simulieren verschiedener Testfälle
async function simulateError(testCase: string | null): Promise<HealthIndices> {
  // Basis-Testdaten
  const baseData: HealthIndices = {
    location_id: 1,
    forecast_date: new Date().toISOString().split('T')[0],
    cold_risk: 3,
    asthma_risk: 5,
    migraine_risk: 7,
    joint_pain_risk: 4,
    temperature_stress: true,
    humidity_stress: false,
    pressure_stress: true,
    recommendations: 'Bei Migräne-Risiko: Ausreichend Flüssigkeit aufnehmen und Stress vermeiden.'
  };

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden');

    case 'invalid':
      return {
        ...baseData,
        cold_risk: 11, // Ungültiger Wert über 10
      };

    case 'database':
      return {
        ...baseData,
        cold_risk: 999999999, // Dies wird einen Datenbankfehler auslösen
      };

    default:
      return baseData;
  }
}

export async function GET(request: Request) {
  console.log('Starte Gesundheitsindices-Aktualisierung...');
  
  try {
    // Extrahiere Test-Parameter aus der URL
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Hole oder simuliere Daten
    const healthData = await simulateError(testCase);

    // Validiere die Daten
    const validatedData = validateHealthIndices(healthData);
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Gesundheitsdaten:', validatedData);

    // Speichere in der Datenbank
    const { error: dbError } = await supabase
      .from('health_indices')
      .upsert(validatedData, {
        onConflict: 'location_id,forecast_date'
      });

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Gesundheitsindices erfolgreich aktualisiert',
      data: validatedData
    });

  } catch (error: any) {
    console.error('Fehler bei der Gesundheitsindices-Aktualisierung:', error);

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