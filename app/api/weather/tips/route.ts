import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase Client initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface für einen einzelnen Gesundheitstipp
interface HealthTip {
  location_id: number;
  tip_date: string;
  category: string;
  target_group?: string;
  title: string;
  description: string;
  action_steps?: string;
  weather_condition?: string;
  temperature_range?: string;
  time_of_day?: string;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  priority: number;
}

// Validierung der Kategorien und Werte
const validCategories = ['exercise', 'nutrition', 'sleep', 'mental_health', 'seasonal'];
const validTargetGroups = ['elderly', 'children', 'allergy_sufferers', 'general'];
const validWeatherConditions = ['hot', 'cold', 'rainy', 'sunny'];
const validTemperatureRanges = ['above_30', 'below_0', 'moderate'];
const validTimesOfDay = ['morning', 'afternoon', 'evening', 'night'];

// Validierungsfunktion für einen einzelnen Tipp
function validateTip(tip: any): HealthTip {
  // Pflichtfelder prüfen
  if (!tip.location_id || !tip.tip_date || !tip.category ||
      !tip.title || !tip.description || !tip.valid_from || 
      tip.priority === undefined) {
    throw new Error('Fehlende Pflichtfelder im Gesundheitstipp');
  }

  // Kategorie validieren
  if (!validCategories.includes(tip.category)) {
    throw new Error(`Ungültige Kategorie: ${tip.category}`);
  }

  // Optionale Felder validieren
  if (tip.target_group && !validTargetGroups.includes(tip.target_group)) {
    throw new Error(`Ungültige Zielgruppe: ${tip.target_group}`);
  }

  if (tip.weather_condition && !validWeatherConditions.includes(tip.weather_condition)) {
    throw new Error(`Ungültige Wetterbedingung: ${tip.weather_condition}`);
  }

  if (tip.temperature_range && !validTemperatureRanges.includes(tip.temperature_range)) {
    throw new Error(`Ungültiger Temperaturbereich: ${tip.temperature_range}`);
  }

  if (tip.time_of_day && !validTimesOfDay.includes(tip.time_of_day)) {
    throw new Error(`Ungültige Tageszeit: ${tip.time_of_day}`);
  }

  // Priorität validieren
  if (!Number.isInteger(tip.priority) || tip.priority < 1 || tip.priority > 5) {
    throw new Error('Ungültige Priorität: Muss eine ganze Zahl zwischen 1 und 5 sein');
  }

  // Datumsformate und -logik prüfen
  const validFrom = new Date(tip.valid_from);
  if (isNaN(validFrom.getTime())) {
    throw new Error('Ungültiges valid_from Datum');
  }

  if (tip.valid_until) {
    const validUntil = new Date(tip.valid_until);
    if (isNaN(validUntil.getTime())) {
      throw new Error('Ungültiges valid_until Datum');
    }
    if (validUntil <= validFrom) {
      throw new Error('valid_until muss nach valid_from liegen');
    }
  }

  // Textfelder validieren
  if (typeof tip.title !== 'string' || tip.title.length === 0 || tip.title.length > 255) {
    throw new Error('Ungültiger Titel: Muss zwischen 1 und 255 Zeichen lang sein');
  }
  if (typeof tip.description !== 'string' || tip.description.length === 0 || tip.description.length > 1000) {
    throw new Error('Ungültige Beschreibung: Muss zwischen 1 und 1000 Zeichen lang sein');
  }
  if (tip.action_steps && (typeof tip.action_steps !== 'string' || tip.action_steps.length > 1000)) {
    throw new Error('Ungültige Handlungsschritte: Dürfen maximal 1000 Zeichen lang sein');
  }

  return tip as HealthTip;
}

// Funktion zum Simulieren verschiedener Testfälle
async function simulateError(testCase: string | null): Promise<HealthTip[]> {
  // Basis-Testdaten
  const baseTips: HealthTip[] = [
    {
      location_id: 1,
      tip_date: new Date().toISOString().split('T')[0],
      category: 'exercise',
      target_group: 'general',
      title: 'Bewegung am Morgen',
      description: 'Nutzen Sie die kühlen Morgenstunden für Ihre sportlichen Aktivitäten',
      action_steps: '1. Aufwärmübungen, 2. 30 Minuten moderate Bewegung, 3. Dehnübungen',
      weather_condition: 'hot',
      temperature_range: 'above_30',
      time_of_day: 'morning',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      priority: 4
    },
    {
      location_id: 1,
      tip_date: new Date().toISOString().split('T')[0],
      category: 'nutrition',
      target_group: 'elderly',
      title: 'Ausreichend Flüssigkeit',
      description: 'Bei hohen Temperaturen ist regelmäßiges Trinken besonders wichtig',
      action_steps: 'Stellen Sie sich mehrere Wasserflaschen bereit und trinken Sie stündlich',
      weather_condition: 'hot',
      temperature_range: 'above_30',
      time_of_day: 'afternoon',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      priority: 5
    }
  ];

  switch (testCase) {
    case 'timeout':
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('API-Timeout: Keine Antwort innerhalb von 5 Sekunden');

    case 'invalid':
      return [{
        ...baseTips[0],
        category: 'invalid_category', // Ungültige Kategorie
      }];

    case 'database':
      return [{
        ...baseTips[0],
        title: 'x'.repeat(1000), // Zu langer Titel
      }];

    default:
      return baseTips;
  }
}

export async function GET(request: Request) {
  console.log('Starte Gesundheitstipps-Aktualisierung...');
  
  try {
    // Extrahiere Test-Parameter aus der URL
    const { searchParams } = new URL(request.url);
    const testCase = searchParams.get('test');
    console.log('Test-Fall:', testCase);

    // Hole oder simuliere Daten
    const tips = await simulateError(testCase);

    // Validiere alle Tipps
    const validatedTips = tips.map(tip => validateTip(tip));
    console.log('API-Antwort erfolgreich validiert');
    console.log('Aufbereitete Tipps:', validatedTips);

    // Speichere in der Datenbank
    const { error: dbError } = await supabase
      .from('health_tips')
      .upsert(validatedTips);

    if (dbError) {
      throw new Error(`Datenbankfehler beim Speichern: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Gesundheitstipps erfolgreich aktualisiert',
      data: validatedTips
    });

  } catch (error: any) {
    console.error('Fehler bei der Gesundheitstipps-Aktualisierung:', error);

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