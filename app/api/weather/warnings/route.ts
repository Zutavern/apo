import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface für eine einzelne Gesundheitswarnung
interface HealthWarning {
  location_id: number;
  warning_date: string;
  warning_type: string;
  severity_level: string;
  title: string;
  description: string;
  recommendations?: string;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
}

// Validierung der Warnungstypen und Schweregrade
const validWarningTypes = ['heat', 'cold', 'pollen', 'uv', 'ozone'];
const validSeverityLevels = ['low', 'moderate', 'high', 'extreme'];

// Validierungsfunktion für eine einzelne Warnung
function validateWarning(warning: any): HealthWarning {
  // Pflichtfelder prüfen
  if (!warning.location_id || !warning.warning_date || !warning.warning_type ||
      !warning.severity_level || !warning.title || !warning.description || 
      !warning.valid_from) {
    throw new Error('Fehlende Pflichtfelder in der Gesundheitswarnung');
  }

  // Warnungstyp validieren
  if (!validWarningTypes.includes(warning.warning_type)) {
    throw new Error(`Ungültiger Warnungstyp: ${warning.warning_type}`);
  }

  // Schweregrad validieren
  if (!validSeverityLevels.includes(warning.severity_level)) {
    throw new Error(`Ungültiger Schweregrad: ${warning.severity_level}`);
  }

  // Datumsformate und -logik prüfen
  const validFrom = new Date(warning.valid_from);
  if (isNaN(validFrom.getTime())) {
    throw new Error('Ungültiges valid_from Datum');
  }

  if (warning.valid_until) {
    const validUntil = new Date(warning.valid_until);
    if (isNaN(validUntil.getTime())) {
      throw new Error('Ungültiges valid_until Datum');
    }
    if (validUntil <= validFrom) {
      throw new Error('valid_until muss nach valid_from liegen');
    }
  }

  // Textfelder validieren
  if (typeof warning.title !== 'string' || warning.title.length === 0 || warning.title.length > 255) {
    throw new Error('Ungültiger Titel: Muss zwischen 1 und 255 Zeichen lang sein');
  }
  if (typeof warning.description !== 'string' || warning.description.length === 0 || warning.description.length > 1000) {
    throw new Error('Ungültige Beschreibung: Muss zwischen 1 und 1000 Zeichen lang sein');
  }
  if (warning.recommendations && (typeof warning.recommendations !== 'string' || warning.recommendations.length > 1000)) {
    throw new Error('Ungültige Empfehlungen: Darf maximal 1000 Zeichen lang sein');
  }

  return warning as HealthWarning;
}

// Funktion zum Simulieren verschiedener Testfälle
async function simulateError(testCase: string | null): Promise<HealthWarning[]> {
  // Basis-Testdaten
  const baseWarnings: HealthWarning[] = [
    {
      location_id: 1,
      warning_date: new Date().toISOString().split('T')[0],
      warning_type: 'heat',
      severity_level: 'high',
      title: 'Hitzewarnung',
      description: 'Hohe Temperaturen über 30°C erwartet',
      recommendations: 'Ausreichend trinken und direkte Sonne meiden',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    },
    {
      location_id: 1,
      warning_date: new Date().toISOString().split('T')[0],
      warning_type: 'uv',
      severity_level: 'extreme',
      title: 'Extreme UV-Strahlung',
      description: 'Sehr hohe UV-Belastung in den Mittagsstunden',
      recommendations: 'Zwischen 11 und 15 Uhr Aufenthalt im Freien vermeiden',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }
  ];

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden');

    case 'invalid':
      return [{
        ...baseWarnings[0],
        warning_type: 'invalid_type', // Ungültiger Warnungstyp
      }];

    case 'database':
      return [{
        ...baseWarnings[0],
        title: 'x'.repeat(10000), // Zu langer Text für die Datenbank
      }];

    default:
      return baseWarnings;
  }
}

export async function GET(request: Request) {
  console.log('Starte Gesundheitswarnungen-Aktualisierung...');
  
  try {
    // Extrahiere Test-Parameter aus der URL
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Hole oder simuliere Daten
    const warnings = await simulateError(testCase);

    // Validiere alle Warnungen
    const validatedWarnings = warnings.map(warning => validateWarning(warning));
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Warnungen:', validatedWarnings);

    // Speichere in der Datenbank
    const { error: dbError } = await supabase
      .from('health_warnings')
      .upsert(validatedWarnings);

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Gesundheitswarnungen erfolgreich aktualisiert',
      data: validatedWarnings
    });

  } catch (error: any) {
    console.error('Fehler bei der Gesundheitswarnungen-Aktualisierung:', error);

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