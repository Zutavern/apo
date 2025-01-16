import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface für die Biometeorologie
interface Biometeorology {
  location_id: number;
  forecast_date: string;
  thermal_load: number;
  feels_like_temperature: number;
  air_pressure: number;
  pressure_change: number;
  air_humidity: number;
  uv_index: number;
  ozone_level: number;
  weather_stress: boolean;
  weather_sensitivity: boolean;
  recommendations: string;
}

// Validierungsfunktion für die Biometeorologie
function validateBiometeorology(data: any): Biometeorology {
  // Überprüfe thermal_load (-3 bis 3)
  if (typeof data.thermal_load !== 'number' || 
      data.thermal_load < -3 || 
      data.thermal_load > 3 || 
      !Number.isInteger(data.thermal_load)) {
    throw new Error('Ungültiger Wert für thermal_load: Muss eine ganze Zahl zwischen -3 und 3 sein');
  }

  // Überprüfe Temperatur und Druck
  const numericFields = ['feels_like_temperature', 'air_pressure', 'pressure_change'];
  for (const field of numericFields) {
    if (typeof data[field] !== 'number' || isNaN(data[field])) {
      throw new Error(`Ungültiger Wert für ${field}: Muss eine Zahl sein`);
    }
  }

  // Überprüfe Luftfeuchtigkeit (0-100)
  if (typeof data.air_humidity !== 'number' || 
      data.air_humidity < 0 || 
      data.air_humidity > 100 || 
      !Number.isInteger(data.air_humidity)) {
    throw new Error('Ungültiger Wert für air_humidity: Muss eine ganze Zahl zwischen 0 und 100 sein');
  }

  // Überprüfe UV-Index
  if (typeof data.uv_index !== 'number' || data.uv_index < 0 || data.uv_index > 12) {
    throw new Error('Ungültiger UV-Index: Muss zwischen 0 und 12 liegen');
  }

  // Überprüfe Ozon-Level (0-500)
  if (typeof data.ozone_level !== 'number' || 
      data.ozone_level < 0 || 
      data.ozone_level > 500 || 
      !Number.isInteger(data.ozone_level)) {
    throw new Error('Ungültiger Wert für ozone_level: Muss eine ganze Zahl zwischen 0 und 500 sein');
  }

  // Überprüfe Boolean-Werte
  const booleanFields = ['weather_stress', 'weather_sensitivity'];
  for (const field of booleanFields) {
    if (typeof data[field] !== 'boolean') {
      throw new Error(`Ungültiger Wert für ${field}: Muss true oder false sein`);
    }
  }

  // Überprüfe Pflichtfelder
  if (!data.location_id || !data.forecast_date) {
    throw new Error('Fehlende Pflichtfelder: location_id oder forecast_date');
  }

  if (typeof data.recommendations !== 'string' || data.recommendations.length === 0) {
    throw new Error('Fehlende oder ungültige Empfehlungen');
  }

  return data as Biometeorology;
}

// Funktion zum Simulieren verschiedener Testfälle
async function simulateError(testCase: string | null): Promise<Biometeorology> {
  // Basis-Testdaten
  const baseData: Biometeorology = {
    location_id: 1,
    forecast_date: new Date().toISOString().split('T')[0],
    thermal_load: 2,
    feels_like_temperature: 18.5,
    air_pressure: 1013.2,
    pressure_change: -2.1,
    air_humidity: 65,
    uv_index: 4.2,
    ozone_level: 125,
    weather_stress: true,
    weather_sensitivity: false,
    recommendations: 'Bei hoher Wärmebelastung: Aktivitäten in die Morgenstunden verlegen und ausreichend trinken.'
  };

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden');

    case 'invalid':
      return {
        ...baseData,
        thermal_load: 5, // Ungültiger Wert über 3
      };

    case 'database':
      return {
        ...baseData,
        air_pressure: 999999999, // Dies wird einen Datenbankfehler auslösen
      };

    default:
      return baseData;
  }
}

export async function GET(request: Request) {
  console.log('Starte Biometeorologie-Aktualisierung...');
  
  try {
    // Extrahiere Test-Parameter aus der URL
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Hole oder simuliere Daten
    const bioData = await simulateError(testCase);

    // Validiere die Daten
    const validatedData = validateBiometeorology(bioData);
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Biometeorologie-Daten:', validatedData);

    // Speichere in der Datenbank
    const { error: dbError } = await supabase
      .from('biometeorology')
      .upsert(validatedData, {
        onConflict: 'location_id,forecast_date'
      });

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Biometeorologie erfolgreich aktualisiert',
      data: validatedData
    });

  } catch (error: any) {
    console.error('Fehler bei der Biometeorologie-Aktualisierung:', error);

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