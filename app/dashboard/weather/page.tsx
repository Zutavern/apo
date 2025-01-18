'use client'

import { useState, useEffect } from 'react'
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sun, 
  CloudRain, 
  Moon, 
  Heart, 
  Pill, 
  Activity,
  AlertTriangle,
  Flower,
  Clock,
  Users,
  Leaf,
  Flower2,
  LayoutList,
  LayoutGrid,
  Layout
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
    uv_index: number
    pressure_msl: number
    surface_pressure: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: number[]
    pressure_msl_mean: number[]
  }
}

type PollenData = {
  hourly: {
    time: string[]
    alder_pollen: number[]
    birch_pollen: number[]
    grass_pollen: number[]
    mugwort_pollen: number[]
    ragweed_pollen: number[]
  }
}

type AirQualityData = {
  current: {
    pm10: number
    pm2_5: number
    nitrogen_dioxide: number
    ozone: number
    european_aqi: number
  }
}

type BiometeoData = {
  circulatory_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  headache_risk: 'Niedrig' | 'Mittel' | 'Hoch'
  rheumatic_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  asthma_risk: 'Niedrig' | 'Mittel' | 'Hoch'
}

type HealthRecommendation = {
  type: 'UV' | 'Hydration' | 'Temperature' | 'Pollen'
  risk_level: 'Niedrig' | 'Mittel' | 'Hoch'
  recommendation: string
}

type MedicalWeatherData = {
  migraineIndex: 'Niedrig' | 'Mittel' | 'Hoch'
  allergyAlert: 'Niedrig' | 'Mittel' | 'Hoch'
  coldRisk: 'Niedrig' | 'Mittel' | 'Hoch'
  recommendations: {
    sunProtection?: string
    medication?: string
    prevention?: string
  }
}

type SeasonalHealth = {
  fluSeason: 'Niedrig' | 'Mittel' | 'Hoch'
  seasonalAllergies: string[]
  vaccineRecommendations: string[]
}

type ChronicConditionIndex = {
  copd_risk: 'Niedrig' | 'Mittel' | 'Hoch'
  rheumatic_load: 'Niedrig' | 'Mittel' | 'Hoch'
  cardiovascular_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  recommendations: {
    copd?: string
    rheumatic?: string
    cardiovascular?: string
  }
}

type MedicationTiming = {
  optimal_times: {
    morning?: string
    noon?: string
    evening?: string
  }
  uv_warnings: string[]
  storage_recommendations: string[]
}

type SeniorHealth = {
  fall_risk: 'Niedrig' | 'Mittel' | 'Hoch'
  temperature_stress: 'Niedrig' | 'Mittel' | 'Hoch'
  outdoor_activity: 'Empfohlen' | 'Mit Vorsicht' | 'Nicht empfohlen'
  recommendations: {
    mobility?: string
    protection?: string
    activity?: string
  }
}

type HerbalMedicine = {
  collection_times: {
    morning?: string
    afternoon?: string
    evening?: string
  }
  storage_conditions: string[]
  seasonal_herbs: string[]
  recommendations: string[]
}

type TherapyWeather = {
  outdoor_therapy: 'Optimal' | 'Bedingt möglich' | 'Nicht empfohlen'
  breathing_conditions: 'Günstig' | 'Neutral' | 'Ungünstig'
  movement_therapy: {
    best_time: string
    intensity: 'Hoch' | 'Moderat' | 'Gering'
    location: 'Draußen' | 'Drinnen' | 'Beides möglich'
  }
  recommendations: string[]
}

type NaturalMedicine = {
  moonphase: {
    phase: 'Neumond' | 'Zunehmend' | 'Vollmond' | 'Abnehmend'
    recommendation: string
  }
  schuessler_salts: {
    primary: string
    secondary: string
    reason: string
  }
  bach_flowers: {
    recommendation: string
    reason: string
  }
  natural_remedies: string[]
}

type AirQualityHealth = {
  general_recommendation: string
  health_impacts: {
    respiratory: string
    cardiovascular: string
    sensitive_groups: string
  }
  activity_recommendations: {
    outdoor_sports: string
    ventilation: string
    mask_recommendation?: string
  }
  pollutant_details: {
    pm25_impact: string
    pm10_impact: string
    ozone_impact: string
  }
}

const HOHENMOLSEN_COORDS = {
  latitude: 51.1667,
  longitude: 12.0833
}

function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bewölkt',
    45: 'Neblig',
    48: 'Neblig (gefrierend)',
    51: 'Leichter Nieselregen',
    53: 'Mäßiger Nieselregen',
    55: 'Starker Nieselregen',
    61: 'Leichter Regen',
    63: 'Mäßiger Regen',
    65: 'Starker Regen',
    71: 'Leichter Schneefall',
    73: 'Mäßiger Schneefall',
    75: 'Starker Schneefall',
    95: 'Gewitter'
  }
  return weatherCodes[code] || 'Unbekannt'
}

function calculateBiometeoData(weatherData: WeatherData): BiometeoData {
  return {
    circulatory_stress: Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) > 5 ? 'Hoch' : 
                        Math.abs(weatherData.current.temperature_2m - weatherData.current.apparent_temperature) > 3 ? 'Mittel' : 'Niedrig',
    headache_risk: Math.abs(weatherData.current.pressure_msl - 1013.25) > 10 ? 'Hoch' :
                   Math.abs(weatherData.current.pressure_msl - 1013.25) > 5 ? 'Mittel' : 'Niedrig',
    rheumatic_stress: weatherData.current.relative_humidity_2m > 80 ? 'Hoch' :
                      weatherData.current.relative_humidity_2m > 60 ? 'Mittel' : 'Niedrig',
    asthma_risk: weatherData.current.relative_humidity_2m > 85 || weatherData.current.temperature_2m < 5 ? 'Hoch' :
                 weatherData.current.relative_humidity_2m > 70 || weatherData.current.temperature_2m < 10 ? 'Mittel' : 'Niedrig'
  }
}

function getHealthRecommendations(weatherData: WeatherData, pollenData: PollenData | null = null): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = []

  // UV-Empfehlungen
  if (weatherData.current.uv_index > 5) {
    recommendations.push({
      type: 'UV',
      risk_level: 'Hoch',
      recommendation: 'Hoher UV-Index: Sonnenschutz verwenden, Mittagssonne meiden'
    })
  }

  // Temperatur-Empfehlungen
  if (weatherData.current.temperature_2m > 30) {
    recommendations.push({
      type: 'Temperature',
      risk_level: 'Hoch',
      recommendation: 'Hitzewarnung: Ausreichend trinken, körperliche Aktivität einschränken'
    })
  } else if (weatherData.current.temperature_2m < 5) {
    recommendations.push({
      type: 'Temperature',
      risk_level: 'Mittel',
      recommendation: 'Kältewarnung: Warm kleiden, Erkältungsprophylaxe beachten'
    })
  }

  // Hydratations-Empfehlungen
  if (weatherData.current.relative_humidity_2m < 40) {
    recommendations.push({
      type: 'Hydration',
      risk_level: 'Hoch',
      recommendation: 'Niedrige Luftfeuchtigkeit: Mehr trinken, Schleimhäute befeuchten'
    })
  }

  return recommendations
}

function getCurrentPollenData(pollenData: PollenData | null) {
  if (!pollenData) return null;
  
  const currentHour = new Date().getHours();
  return {
    alder: pollenData.hourly.alder_pollen[currentHour] || 0,
    birch: pollenData.hourly.birch_pollen[currentHour] || 0,
    grass: pollenData.hourly.grass_pollen[currentHour] || 0,
    mugwort: pollenData.hourly.mugwort_pollen[currentHour] || 0,
    ragweed: pollenData.hourly.ragweed_pollen[currentHour] || 0
  };
}

function calculateMedicalWeatherData(weatherData: WeatherData, pollenData: PollenData | null): MedicalWeatherData {
  // Migräne-Index basierend auf Luftdruckänderungen
  const migraineIndex = Math.abs(weatherData.current.pressure_msl - 1013.25) > 10 ? 'Hoch' :
                       Math.abs(weatherData.current.pressure_msl - 1013.25) > 5 ? 'Mittel' : 'Niedrig'

  // Erkältungsrisiko basierend auf Temperatur und Luftfeuchtigkeit
  const coldRisk = weatherData.current.temperature_2m < 10 && weatherData.current.relative_humidity_2m > 70 ? 'Hoch' :
                  weatherData.current.temperature_2m < 15 && weatherData.current.relative_humidity_2m > 60 ? 'Mittel' : 'Niedrig'

  // Allergie-Warnung basierend auf Pollenflug
  const currentPollen = getCurrentPollenData(pollenData)
  const allergyAlert = currentPollen && Object.values(currentPollen).some(value => value > 4) ? 'Hoch' :
                      currentPollen && Object.values(currentPollen).some(value => value > 2) ? 'Mittel' : 'Niedrig'

  return {
    migraineIndex,
    allergyAlert,
    coldRisk,
    recommendations: {
      sunProtection: weatherData.current.uv_index > 5 ? 
        'Hoher UV-Schutz (LSF 30+) empfohlen' : 
        weatherData.current.uv_index > 2 ? 
        'Mittlerer UV-Schutz (LSF 15+) empfohlen' : 
        'Niedriger UV-Schutz ausreichend',
      medication: allergyAlert === 'Hoch' ? 
        'Antihistaminika bereithalten' : 
        allergyAlert === 'Mittel' ? 
        'Vorsorgliche Medikation erwägen' : 
        'Keine besondere Medikation erforderlich',
      prevention: coldRisk === 'Hoch' ? 
        'Immunsystem stärken, warm anziehen' : 
        coldRisk === 'Mittel' ? 
        'Auf angemessene Kleidung achten' : 
        'Normale Vorsorge ausreichend'
    }
  }
}

function calculateSeasonalHealth(weatherData: WeatherData, currentDate: Date = new Date()): SeasonalHealth {
  const month = currentDate.getMonth() + 1; // 1-12
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;

  // Grippesaison-Risiko (höher im Winter und bei bestimmten Wetterbedingungen)
  const fluSeason = 
    (month >= 11 || month <= 3) && temp < 10 && humidity > 60 ? 'Hoch' :
    (month >= 10 || month <= 4) && temp < 15 ? 'Mittel' : 'Niedrig';

  // Saisonale Allergien
  const seasonalAllergies = [];
  if (month >= 2 && month <= 4) seasonalAllergies.push('Birke, Erle, Hasel');
  if (month >= 5 && month <= 7) seasonalAllergies.push('Gräser');
  if (month >= 7 && month <= 9) seasonalAllergies.push('Beifuß, Ambrosia');

  // Impfempfehlungen
  const vaccineRecommendations = [];
  if (month >= 9 && month <= 11) {
    vaccineRecommendations.push('Grippeimpfung für Risikogruppen empfohlen');
  }
  if (month >= 3 && month <= 5) {
    vaccineRecommendations.push('FSME-Impfung vor Zeckensaison prüfen');
  }

  return {
    fluSeason,
    seasonalAllergies,
    vaccineRecommendations
  };
}

function calculateChronicConditionIndex(weatherData: WeatherData): ChronicConditionIndex {
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;
  const pressure = weatherData.current.pressure_msl;

  // COPD-Risiko
  const copd_risk = 
    (temp < 5 || temp > 30 || humidity > 80) ? 'Hoch' :
    (temp < 10 || temp > 25 || humidity > 70) ? 'Mittel' : 'Niedrig';

  // Rheuma-Belastung
  const rheumatic_load = 
    (humidity > 80 || Math.abs(pressure - 1013.25) > 10) ? 'Hoch' :
    (humidity > 70 || Math.abs(pressure - 1013.25) > 5) ? 'Mittel' : 'Niedrig';

  // Herz-Kreislauf-Belastung
  const cardiovascular_stress = 
    (temp > 30 || temp < 0 || Math.abs(pressure - 1013.25) > 10) ? 'Hoch' :
    (temp > 25 || temp < 5 || Math.abs(pressure - 1013.25) > 5) ? 'Mittel' : 'Niedrig';

  return {
    copd_risk,
    rheumatic_load,
    cardiovascular_stress,
    recommendations: {
      copd: copd_risk === 'Hoch' ? 
        'Aufenthalt im Freien vermeiden, Medikamente griffbereit halten' :
        copd_risk === 'Mittel' ? 
        'Aktivitäten anpassen, auf Symptome achten' : 
        'Normale Aktivitäten möglich',
      rheumatic: rheumatic_load === 'Hoch' ? 
        'Warme Kleidung, Bewegung im Warmen, Schmerzmedikation bereithalten' :
        rheumatic_load === 'Mittel' ? 
        'Moderate Bewegung, auf Gelenkschutz achten' :
        'Normale Aktivitäten möglich',
      cardiovascular: cardiovascular_stress === 'Hoch' ? 
        'Anstrengung vermeiden, Medikamente wie verordnet einnehmen' :
        cardiovascular_stress === 'Mittel' ? 
        'Moderate Aktivität, auf Symptome achten' :
        'Normale Aktivitäten möglich'
    }
  };
}

function calculateMedicationTiming(weatherData: WeatherData): MedicationTiming {
  const isDay = weatherData.current.is_day === 1;
  const temp = weatherData.current.temperature_2m;
  const uv = weatherData.current.uv_index;

  const optimal_times: MedicationTiming['optimal_times'] = {};
  const uv_warnings: string[] = [];
  const storage_recommendations: string[] = [];

  // Optimale Einnahmezeiten
  if (isDay) {
    optimal_times.morning = "Vor 10 Uhr (niedrigste UV-Belastung)";
    optimal_times.noon = uv > 5 ? "Meiden Sie die Mittagszeit" : "Zwischen 12-14 Uhr möglich";
    optimal_times.evening = "Nach 18 Uhr";
  } else {
    optimal_times.evening = "Vor dem Schlafengehen";
  }

  // UV-Warnungen für photosensible Medikamente
  if (uv > 5) {
    uv_warnings.push("Photosensible Medikamente: Sonnenlicht meiden");
    uv_warnings.push("Hautreaktionen möglich bei: Antibiotika, Diuretika");
  }

  // Lagerungsempfehlungen
  if (temp > 25) {
    storage_recommendations.push("Medikamente kühl (unter 25°C) lagern");
    storage_recommendations.push("Insulin im Kühlschrank aufbewahren");
  }
  if (weatherData.current.relative_humidity_2m > 60) {
    storage_recommendations.push("Medikamente vor Feuchtigkeit schützen");
  }

  return {
    optimal_times,
    uv_warnings,
    storage_recommendations
  };
}

function calculateSeniorHealth(weatherData: WeatherData): SeniorHealth {
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;
  const precipitation = weatherData.current.precipitation;

  // Sturzrisiko
  const fall_risk = 
    precipitation > 0 || temp < 2 ? 'Hoch' :
    temp < 5 || humidity > 80 ? 'Mittel' : 'Niedrig';

  // Temperaturbelastung
  const temperature_stress = 
    temp > 30 || temp < 5 ? 'Hoch' :
    temp > 25 || temp < 10 ? 'Mittel' : 'Niedrig';

  // Aktivitätsempfehlung
  const outdoor_activity = 
    (temp > 30 || temp < 5 || precipitation > 0) ? 'Nicht empfohlen' :
    (temp > 25 || temp < 10 || humidity > 80) ? 'Mit Vorsicht' : 'Empfohlen';

  return {
    fall_risk,
    temperature_stress,
    outdoor_activity,
    recommendations: {
      mobility: fall_risk === 'Hoch' ? 
        'Ausgänge möglichst vermeiden oder Begleitung nutzen' :
        fall_risk === 'Mittel' ? 
        'Rutschfeste Schuhe tragen, vorsichtig gehen' :
        'Normale Vorsicht ausreichend',
      protection: temperature_stress === 'Hoch' ? 
        'Drinnen bleiben, Räume temperieren, viel trinken' :
        temperature_stress === 'Mittel' ? 
        'Aktivitäten in klimatisierte Tageszeiten verlegen' :
        'Normale Aktivitäten möglich',
      activity: outdoor_activity === 'Nicht empfohlen' ?
        'Aktivitäten in Innenräumen durchführen' :
        outdoor_activity === 'Mit Vorsicht' ?
        'Kurze Aktivitäten möglich, regelmäßige Pausen' :
        'Moderate Bewegung an der frischen Luft empfohlen'
    }
  };
}

function calculateHerbalMedicine(weatherData: WeatherData): HerbalMedicine {
  const isDay = weatherData.current.is_day === 1;
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;
  const month = new Date().getMonth() + 1;

  const collection_times: HerbalMedicine['collection_times'] = {};
  const storage_conditions: string[] = [];
  const seasonal_herbs: string[] = [];
  const recommendations: string[] = [];

  // Sammelzeiten basierend auf Tageszeit und Wetter
  if (isDay && !weatherData.current.precipitation) {
    collection_times.morning = "Früh morgens (Tau verdunstet)";
    if (temp < 25) {
      collection_times.afternoon = "Nachmittags (Pflanzen trocken)";
    }
    collection_times.evening = "Spätnachmittag (kühlere Temperaturen)";
  }

  // Lagerungsempfehlungen
  if (humidity > 60) {
    storage_conditions.push("Kräuter gründlich trocknen vor der Lagerung");
    storage_conditions.push("Luftdichte Behälter verwenden");
  }
  if (temp > 22) {
    storage_conditions.push("Kühl und dunkel lagern");
  }

  // Saisonale Heilpflanzen
  if (month >= 3 && month <= 5) {
    seasonal_herbs.push("Löwenzahn, Brennnessel, Gänseblümchen");
    recommendations.push("Ideale Zeit für Frühjahrskräuter");
  } else if (month >= 6 && month <= 8) {
    seasonal_herbs.push("Johanniskraut, Kamille, Schafgarbe");
    recommendations.push("Hochsaison für Blütenpflanzen");
  } else if (month >= 9 && month <= 11) {
    seasonal_herbs.push("Hagebutten, Holunder, Thymian");
    recommendations.push("Letzte Sammelperiode vor Winter");
  }

  return {
    collection_times,
    storage_conditions,
    seasonal_herbs,
    recommendations
  };
}

function calculateTherapyWeather(weatherData: WeatherData): TherapyWeather {
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;
  const wind = weatherData.current.wind_speed_10m;
  const precipitation = weatherData.current.precipitation;

  // Outdoor-Therapie Bewertung
  const outdoor_therapy = 
    (temp < 10 || temp > 28 || precipitation > 0 || wind > 20) ? 'Nicht empfohlen' :
    (temp < 15 || temp > 25 || wind > 15) ? 'Bedingt möglich' : 'Optimal';

  // Atembedingungen
  const breathing_conditions = 
    (humidity > 80 || temp < 5 || temp > 30) ? 'Ungünstig' :
    (humidity > 70 || temp < 10 || temp > 25) ? 'Neutral' : 'Günstig';

  // Bewegungstherapie
  const movement_therapy = {
    best_time: temp > 20 ? 'Vormittags oder abends' : 'Mittags',
    intensity: 
      (temp > 28 || temp < 5) ? 'Gering' :
      (temp > 25 || temp < 10) ? 'Moderat' : 'Hoch',
    location: 
      (precipitation > 0 || wind > 20) ? 'Drinnen' :
      (wind > 15 || temp < 10) ? 'Beides möglich' : 'Draußen'
  };

  // Therapieempfehlungen
  const recommendations = [];
  if (outdoor_therapy === 'Optimal') {
    recommendations.push("Ideale Bedingungen für Outdoor-Aktivitäten");
  }
  if (breathing_conditions === 'Günstig') {
    recommendations.push("Gute Bedingungen für Atemübungen");
  }
  if (movement_therapy.intensity === 'Hoch') {
    recommendations.push("Intensive Übungen möglich");
  }

  return {
    outdoor_therapy,
    breathing_conditions,
    movement_therapy,
    recommendations
  };
}

function calculateNaturalMedicine(weatherData: WeatherData): NaturalMedicine {
  const temp = weatherData.current.temperature_2m;
  const humidity = weatherData.current.relative_humidity_2m;
  const pressure = weatherData.current.pressure_msl;
  
  // Berechne Mondphase (vereinfacht)
  const day = new Date().getDate();
  const moonphase = day <= 7 ? 'Neumond' :
                   day <= 14 ? 'Zunehmend' :
                   day <= 21 ? 'Vollmond' : 'Abnehmend';
  
  // Mondphasen-Empfehlungen
  const moonphaseRec = {
    'Neumond': 'Zeit für Entgiftung und Reinigung',
    'Zunehmend': 'Optimal für stärkende Behandlungen',
    'Vollmond': 'Intensive Wirkung von Heilmitteln',
    'Abnehmend': 'Gut für ausgleichende Therapien'
  }[moonphase];

  // Schüßler-Salze basierend auf Wetter
  let schuessler = {
    primary: '',
    secondary: '',
    reason: ''
  };

  if (temp < 10) {
    schuessler = {
      primary: 'Nr. 3 Ferrum phosphoricum',
      secondary: 'Nr. 5 Kalium phosphoricum',
      reason: 'Zur Stärkung der Abwehrkräfte bei Kälte'
    };
  } else if (humidity > 70) {
    schuessler = {
      primary: 'Nr. 8 Natrium chloratum',
      secondary: 'Nr. 4 Kalium chloratum',
      reason: 'Für bessere Regulation des Flüssigkeitshaushalts'
    };
  } else if (pressure < 1000) {
    schuessler = {
      primary: 'Nr. 7 Magnesium phosphoricum',
      secondary: 'Nr. 2 Calcium phosphoricum',
      reason: 'Bei Wetterfühligkeit und Druckempfindlichkeit'
    };
  } else {
    schuessler = {
      primary: 'Nr. 7 Magnesium phosphoricum',
      secondary: 'Nr. 11 Silicea',
      reason: 'Für allgemeines Wohlbefinden'
    };
  }

  // Bach-Blüten Empfehlung
  let bachFlowers = {
    recommendation: '',
    reason: ''
  };

  if (weatherData.current.is_day === 0) {
    bachFlowers = {
      recommendation: 'White Chestnut & Aspen',
      reason: 'Unterstützung bei nächtlicher Unruhe'
    };
  } else if (temp > 25) {
    bachFlowers = {
      recommendation: 'Elm & Oak',
      reason: 'Für Ausgeglichenheit bei Hitzebelastung'
    };
  } else if (weatherData.current.precipitation > 0) {
    bachFlowers = {
      recommendation: 'Gentian & Gorse',
      reason: 'Für positive Stimmung bei trübem Wetter'
    };
  } else {
    bachFlowers = {
      recommendation: 'Walnut & Hornbeam',
      reason: 'Für Anpassungsfähigkeit im Tagesverlauf'
    };
  }

  // Naturheilkundliche Anwendungen
  const natural_remedies = [];
  
  if (temp < 15) {
    natural_remedies.push('Ingwertee zur Erwärmung');
    natural_remedies.push('Thymiandampfbad bei Erkältungsneigung');
  }
  if (humidity < 40) {
    natural_remedies.push('Luftbefeuchtung mit ätherischen Ölen');
  }
  if (pressure < 1000) {
    natural_remedies.push('Melissentee bei Wetterumschwung');
  }
  if (weatherData.current.uv_index > 5) {
    natural_remedies.push('Aloe Vera zur Hautpflege');
  }

  return {
    moonphase: {
      phase: moonphase,
      recommendation: moonphaseRec
    },
    schuessler_salts: schuessler,
    bach_flowers: bachFlowers,
    natural_remedies
  };
}

function calculateAirQualityHealth(airQualityData: AirQualityData | null): AirQualityHealth | null {
  if (!airQualityData) return null;

  const { pm2_5, pm10, ozone, european_aqi } = airQualityData.current;

  // Allgemeine Empfehlung basierend auf AQI
  let general_recommendation = '';
  if (european_aqi <= 25) {
    general_recommendation = 'Ausgezeichnete Luftqualität - Ideal für alle Aktivitäten';
  } else if (european_aqi <= 50) {
    general_recommendation = 'Gute Luftqualität - Geeignet für normale Aktivitäten';
  } else if (european_aqi <= 75) {
    general_recommendation = 'Mäßige Luftqualität - Empfindliche Personen sollten vorsichtig sein';
  } else {
    general_recommendation = 'Schlechte Luftqualität - Aktivitäten im Freien einschränken';
  }

  // Gesundheitliche Auswirkungen
  const health_impacts = {
    respiratory: pm2_5 > 20 ? 
      'Erhöhtes Risiko für Atemwegsreizungen' : 
      'Geringes Risiko für Atemwegsbelastungen',
    cardiovascular: pm2_5 > 25 ? 
      'Mögliche Belastung für Herz-Kreislauf-System' : 
      'Keine besondere Belastung für Herz-Kreislauf-System',
    sensitive_groups: european_aqi > 50 ? 
      'Vorsicht für Asthmatiker und Allergiker' : 
      'Keine besonderen Einschränkungen für empfindliche Personen'
  };

  // Aktivitätsempfehlungen
  const activity_recommendations = {
    outdoor_sports: european_aqi <= 50 ? 
      'Outdoor-Sport uneingeschränkt möglich' : 
      'Sport in Innenräumen empfohlen',
    ventilation: pm10 < 30 ? 
      'Regelmäßiges Lüften empfohlen' : 
      'Kurzes Stoßlüften zu Zeiten mit besserer Luftqualität',
    mask_recommendation: european_aqi > 75 ? 
      'FFP2-Maske für empfindliche Personen empfohlen' : 
      undefined
  };

  // Schadstoff-Details
  const pollutant_details = {
    pm25_impact: `Feinstaub PM2.5: ${
      pm2_5 < 10 ? 'Sehr niedrig - Keine Gesundheitsgefährdung' :
      pm2_5 < 20 ? 'Niedrig - Geringe Belastung' :
      'Erhöht - Mögliche Gesundheitsauswirkungen'
    }`,
    pm10_impact: `Feinstaub PM10: ${
      pm10 < 20 ? 'Sehr niedrig - Keine Gesundheitsgefährdung' :
      pm10 < 40 ? 'Niedrig - Geringe Belastung' :
      'Erhöht - Mögliche Gesundheitsauswirkungen'
    }`,
    ozone_impact: `Ozon: ${
      ozone < 60 ? 'Niedrig - Keine Gesundheitsgefährdung' :
      ozone < 120 ? 'Moderat - Mäßige Belastung' :
      'Erhöht - Mögliche Atemwegsreizungen'
    }`
  };

  return {
    general_recommendation,
    health_impacts,
    activity_recommendations,
    pollutant_details
  };
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [pollenData, setPollenData] = useState<PollenData | null>(null)
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'db'>('api')
  const [layout, setLayout] = useState<'single' | 'double' | 'triple'>('single')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Formatiere das aktuelle Datum
  const currentDate = new Date()
  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(currentDate)

  const handleLayoutToggle = () => {
    setLayout(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Direkt von der API laden
      const updateResponse = await fetch('/api/weather/update')
      if (!updateResponse.ok) {
        throw new Error('Fehler beim Aktualisieren der Wetterdaten')
      }
      
      const weatherResponse = await updateResponse.json()
      if (weatherResponse.success && weatherResponse.data) {
        setWeatherData({
          current: {
            temperature_2m: weatherResponse.data.temperature_2m,
            relative_humidity_2m: weatherResponse.data.relative_humidity_2m,
            apparent_temperature: weatherResponse.data.apparent_temperature,
            precipitation: weatherResponse.data.precipitation,
            wind_speed_10m: weatherResponse.data.wind_speed_10m,
            weather_code: weatherResponse.data.weather_code,
            is_day: weatherResponse.data.is_day,
            uv_index: weatherResponse.data.uv_index,
            pressure_msl: weatherResponse.data.pressure_msl,
            surface_pressure: weatherResponse.data.surface_pressure
          },
          daily: {
            time: [new Date().toISOString().split('T')[0]],
            temperature_2m_max: [weatherResponse.data.temperature_2m + 2],
            temperature_2m_min: [weatherResponse.data.temperature_2m - 2],
            precipitation_sum: [weatherResponse.data.precipitation * 24],
            weather_code: [weatherResponse.data.weather_code],
            sunrise: [weatherResponse.data.sunrise],
            sunset: [weatherResponse.data.sunset],
            uv_index_max: [weatherResponse.data.uv_index],
            pressure_msl_mean: [weatherResponse.data.pressure_msl]
          }
        })
        setDataSource('api')
        setLastUpdate(new Date())
        console.log('Daten von API geladen')
      } else {
        throw new Error('Keine Wetterdaten verfügbar')
      }

      // Rest der Daten von APIs laden...
      const [pollenResponse, airQualityResponse] = await Promise.all([
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
        ),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi`
        )
      ])

      if (!pollenResponse.ok || !airQualityResponse.ok) {
        throw new Error('Fehler beim Abrufen der Daten')
      }

      const [pollenData, airQualityData] = await Promise.all([
        pollenResponse.json(),
        airQualityResponse.json()
      ])

      setPollenData(pollenData)
      setAirQualityData(airQualityData)
    } catch (err) {
      console.error('Fetch Error:', err)
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Berechne Biometeorologie-Daten
  const biometeoData = weatherData ? calculateBiometeoData(weatherData) : null
  
  // Generiere Gesundheitsempfehlungen
  const healthRecommendations = weatherData ? getHealthRecommendations(weatherData, pollenData) : []

  // Berechne medizinische Wetterdaten
  const medicalWeatherData = weatherData ? calculateMedicalWeatherData(weatherData, pollenData) : null

  // Berechne zusätzliche Gesundheitsdaten
  const seasonalHealth = weatherData ? calculateSeasonalHealth(weatherData) : null;
  const chronicConditionIndex = weatherData ? calculateChronicConditionIndex(weatherData) : null;
  const medicationTiming = weatherData ? calculateMedicationTiming(weatherData) : null;
  const seniorHealth = weatherData ? calculateSeniorHealth(weatherData) : null;
  const herbalMedicine = weatherData ? calculateHerbalMedicine(weatherData) : null;
  const therapyWeather = weatherData ? calculateTherapyWeather(weatherData) : null;
  const naturalMedicine = weatherData ? calculateNaturalMedicine(weatherData) : null;

  // Berechne Luftqualitäts-Gesundheitsdaten
  const airQualityHealth = airQualityData ? calculateAirQualityHealth(airQualityData) : null;

  console.log('Current State:', {
    loading,
    error,
    weatherData: weatherData ? JSON.stringify(weatherData, null, 2) : null
  })

  const getLayoutIcon = () => {
    switch (layout) {
      case 'single':
        return <LayoutGrid className="h-4 w-4 text-blue-500" />
      case 'double':
        return <LayoutList className="h-4 w-4 text-blue-500" />
      case 'triple':
        return <Layout className="h-4 w-4 text-blue-500" />
    }
  }

  const getLayoutTitle = () => {
    switch (layout) {
      case 'single':
        return "Zweispaltiges Layout"
      case 'double':
        return "Dreispaltiges Layout"
      case 'triple':
        return "Einspaltiges Layout"
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Aktuelles Wetter in Hohenmülsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={handleLayoutToggle}
              title={getLayoutTitle()}
            >
              {getLayoutIcon()}
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={() => {}}
              disabled
            >
              <Cloud className="h-4 w-4 text-blue-500" />
              <span>Update Daten</span>
            </button>
          </div>
        </div>
        <div className="text-center text-gray-500">
          Wetterdaten werden geladen...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Aktuelles Wetter in Hohenmülsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={handleLayoutToggle}
              title={getLayoutTitle()}
            >
              {getLayoutIcon()}
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={() => {}}
            >
              <Cloud className="h-4 w-4 text-blue-500" />
              <span>Update Daten</span>
            </button>
          </div>
        </div>
        <div className="text-center text-red-500">
          Fehler: {error}
        </div>
      </div>
    )
  }

  if (!weatherData) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Aktuelles Wetter in Hohenmülsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={handleLayoutToggle}
              title={getLayoutTitle()}
            >
              {getLayoutIcon()}
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
              onClick={() => {}}
            >
              <Cloud className="h-4 w-4 text-blue-500" />
              <span>Update Daten</span>
            </button>
          </div>
        </div>
        <div className="text-center text-red-500">
          Keine Wetterdaten verfügbar
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Aktuelles Wetter in Hohenmülsen am {formattedDate}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })} Uhr
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleLayoutToggle}
            title={getLayoutTitle()}
          >
            {getLayoutIcon()}
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleUpdate}
            disabled={loading}
          >
            <Cloud className={`h-4 w-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Wird aktualisiert...' : 'Update Daten'}</span>
          </button>
        </div>
      </div>
      <div className={`grid gap-4 ${
        layout === 'single' ? 'grid-cols-1' : 
        layout === 'double' ? 'grid-cols-1 md:grid-cols-2' : 
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {/* Aktuelles Wetter Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Aktuelles Wetter</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                <div 
                  className={`w-2 h-2 rounded-full ${dataSource === 'db' ? 'bg-green-500' : 'bg-red-500'}`}
                  title={`Daten von ${dataSource === 'db' ? 'Datenbank' : 'API'}`}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                {weatherData.current.is_day ? (
                  <Sun className="h-8 w-8 text-yellow-500" />
                ) : (
                  <Moon className="h-8 w-8 text-blue-400" />
                )}
                <div>
                  <span className="text-4xl font-medium text-gray-100">{weatherData.current.temperature_2m}°C</span>
                  <p className="text-gray-400">{getWeatherDescription(weatherData.current.weather_code)}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-sm text-gray-400">Gefühlt wie</p>
                  <p className="text-xl text-gray-200">{weatherData.current.apparent_temperature}°C</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Luftfeuchte</p>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl text-gray-100">{weatherData.current.relative_humidity_2m}%</span>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Wind</p>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl text-gray-100">{weatherData.current.wind_speed_10m} km/h</span>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Regen</p>
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl text-gray-100">{weatherData.current.precipitation} mm</span>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Luftdruck</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl text-gray-100">{weatherData.current.pressure_msl} hPa</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">UV-Index</p>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl text-gray-100">{weatherData.current.uv_index}</span>
                  <span className="text-sm px-2 py-0.5 rounded bg-green-900 text-green-300">Niedrig</span>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Sonnenzeiten</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-yellow-500" />
                    <span className="text-gray-200">08:05</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon className="h-3 w-3 text-blue-400" />
                    <span className="text-gray-200">16:38</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pollenflug Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Pollenflug</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {pollenData && getCurrentPollenData(pollenData) ? (
                Object.entries(getCurrentPollenData(pollenData)).map(([type, value]) => (
                  <div key={type} className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 capitalize">{type}</p>
                    <div className="flex items-center gap-2">
                      <Flower2 className="h-4 w-4 text-purple-500" />
                      <span className="text-2xl text-gray-100">{value}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        Number(value) > 4 ? 'bg-red-900 text-red-300' :
                        Number(value) > 2 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {Number(value) > 4 ? 'Hoch' :
                         Number(value) > 2 ? 'Mittel' : 'Niedrig'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-400">
                  Keine Pollendaten verfügbar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Biometeorologie Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Biometeorologie</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {biometeoData && (
                <>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Kreislaufbelastung</p>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-2xl text-gray-100">{biometeoData.circulatory_stress}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        biometeoData.circulatory_stress === 'Hoch' ? 'bg-red-900 text-red-300' :
                        biometeoData.circulatory_stress === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {biometeoData.circulatory_stress}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Kopfschmerz-Risiko</p>
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl text-gray-100">{biometeoData.headache_risk}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        biometeoData.headache_risk === 'Hoch' ? 'bg-red-900 text-red-300' :
                        biometeoData.headache_risk === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {biometeoData.headache_risk}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Rheuma-Belastung</p>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <span className="text-2xl text-gray-100">{biometeoData.rheumatic_stress}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        biometeoData.rheumatic_stress === 'Hoch' ? 'bg-red-900 text-red-300' :
                        biometeoData.rheumatic_stress === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {biometeoData.rheumatic_stress}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Asthma-Risiko</p>
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-500" />
                      <span className="text-2xl text-gray-100">{biometeoData.asthma_risk}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        biometeoData.asthma_risk === 'Hoch' ? 'bg-red-900 text-red-300' :
                        biometeoData.asthma_risk === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {biometeoData.asthma_risk}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Luftqualität Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Luftqualität</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {airQualityData ? (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Luftqualitätsindex (AQI)</p>
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl text-gray-100">{airQualityData.current.european_aqi}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      airQualityData.current.european_aqi > 75 ? 'bg-red-900 text-red-300' :
                      airQualityData.current.european_aqi > 50 ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {airQualityData.current.european_aqi > 75 ? 'Schlecht' :
                       airQualityData.current.european_aqi > 50 ? 'Mäßig' : 'Gut'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">PM2.5</p>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-2xl text-gray-100">{airQualityData.current.pm2_5}</span>
                      <span className="text-sm text-gray-400">µg/m³</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">PM10</p>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-2xl text-gray-100">{airQualityData.current.pm10}</span>
                      <span className="text-sm text-gray-400">µg/m³</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Ozon</p>
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl text-gray-100">{airQualityData.current.ozone}</span>
                      <span className="text-sm text-gray-400">µg/m³</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Stickstoffdioxid</p>
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-purple-500" />
                      <span className="text-2xl text-gray-100">{airQualityData.current.nitrogen_dioxide}</span>
                      <span className="text-sm text-gray-400">µg/m³</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                Keine Luftqualitätsdaten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7-Tage Vorhersage Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">7-Tage Vorhersage</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {weatherData.daily.time.map((date: string, index: number) => (
                <div key={date} className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-200">
                        {new Date(date).toLocaleDateString('de-DE', { weekday: 'long' })}
                      </div>
                      <div className="flex items-center gap-2">
                        {weatherData.daily.weather_code[index] < 3 ? (
                          <Sun className="h-4 w-4 text-yellow-500" />
                        ) : weatherData.daily.weather_code[index] < 60 ? (
                          <Cloud className="h-4 w-4 text-gray-400" />
                        ) : (
                          <CloudRain className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm text-gray-400">
                          {getWeatherDescription(weatherData.daily.weather_code[index])}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{weatherData.daily.temperature_2m_min[index]}°</span>
                      <span className="text-xl text-gray-200">{weatherData.daily.temperature_2m_max[index]}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medizinische Wetterwarnungen Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Medizinische Wetterwarnungen</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {medicalWeatherData && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Migräne-Index</p>
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-purple-500" />
                    <span className="text-2xl text-gray-100">{medicalWeatherData.migraineIndex}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      medicalWeatherData.migraineIndex === 'Hoch' ? 'bg-red-900 text-red-300' :
                      medicalWeatherData.migraineIndex === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {medicalWeatherData.migraineIndex}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Allergie-Warnung</p>
                  <div className="flex items-center gap-2">
                    <Flower2 className="h-4 w-4 text-pink-500" />
                    <span className="text-2xl text-gray-100">{medicalWeatherData.allergyAlert}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      medicalWeatherData.allergyAlert === 'Hoch' ? 'bg-red-900 text-red-300' :
                      medicalWeatherData.allergyAlert === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {medicalWeatherData.allergyAlert}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Erkältungsrisiko</p>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl text-gray-100">{medicalWeatherData.coldRisk}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      medicalWeatherData.coldRisk === 'Hoch' ? 'bg-red-900 text-red-300' :
                      medicalWeatherData.coldRisk === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {medicalWeatherData.coldRisk}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">UV-Schutz</p>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg text-gray-100">{medicalWeatherData.recommendations.sunProtection}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saisonale Gesundheit Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Saisonale Gesundheit</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {seasonalHealth && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Grippesaison-Risiko</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{seasonalHealth.fluSeason}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      seasonalHealth.fluSeason === 'Hoch' ? 'bg-red-900 text-red-300' :
                      seasonalHealth.fluSeason === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {seasonalHealth.fluSeason}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Saisonale Allergene</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {seasonalHealth.seasonalAllergies.map((allergy, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Impfempfehlungen</p>
                  <div className="space-y-2 mt-2">
                    {seasonalHealth.vaccineRecommendations.map((rec, index) => (
                      <p key={index} className="text-sm text-gray-200">
                        {rec}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chronische Erkrankungen Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Chronische Erkrankungen</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {chronicConditionIndex && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">COPD-Risiko</p>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl text-gray-100">{chronicConditionIndex.copd_risk}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      chronicConditionIndex.copd_risk === 'Hoch' ? 'bg-red-900 text-red-300' :
                      chronicConditionIndex.copd_risk === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {chronicConditionIndex.copd_risk}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{chronicConditionIndex.recommendations.copd}</p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Rheuma-Belastung</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{chronicConditionIndex.rheumatic_load}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      chronicConditionIndex.rheumatic_load === 'Hoch' ? 'bg-red-900 text-red-300' :
                      chronicConditionIndex.rheumatic_load === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {chronicConditionIndex.rheumatic_load}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{chronicConditionIndex.recommendations.rheumatic}</p>
                </div>

                <div className="col-span-2 bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Herz-Kreislauf-Belastung</p>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-2xl text-gray-100">{chronicConditionIndex.cardiovascular_stress}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      chronicConditionIndex.cardiovascular_stress === 'Hoch' ? 'bg-red-900 text-red-300' :
                      chronicConditionIndex.cardiovascular_stress === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {chronicConditionIndex.cardiovascular_stress}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{chronicConditionIndex.recommendations.cardiovascular}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medikamenten-Timing Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Medikamenten-Timing</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {medicationTiming && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Optimal Einnahmezeiten</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(medicationTiming.optimal_times).map(([time, recommendation]) => (
                      <span key={time} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {time}: {recommendation}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">UV-Warnungen</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {medicationTiming.uv_warnings.map((warning, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Lagerungsempfehlungen</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {medicationTiming.storage_recommendations.map((recommendation, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {recommendation}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Senioren-Gesundheit Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Senioren-Gesundheit</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {seniorHealth && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Sturzrisiko</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{seniorHealth.fall_risk}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      seniorHealth.fall_risk === 'Hoch' ? 'bg-red-900 text-red-300' :
                      seniorHealth.fall_risk === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {seniorHealth.fall_risk}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Temperaturbelastung</p>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl text-gray-100">{seniorHealth.temperature_stress}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${
                      seniorHealth.temperature_stress === 'Hoch' ? 'bg-red-900 text-red-300' :
                      seniorHealth.temperature_stress === 'Mittel' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {seniorHealth.temperature_stress}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Aktivitätsempfehlung</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{seniorHealth.outdoor_activity}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heilpflanzen & Kräuter Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Heilpflanzen & Kräuter</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {herbalMedicine && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Sammelzeiten</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(herbalMedicine.collection_times).map(([time, recommendation]) => (
                      <span key={time} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {time}: {recommendation}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Lagerungsempfehlungen</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {herbalMedicine.storage_conditions.map((recommendation, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {recommendation}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Saisonale Heilpflanzen</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {herbalMedicine.seasonal_herbs.map((herb, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {herb}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Therapie-Wetter Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Therapie-Wetter</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {therapyWeather && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Outdoor-Therapie</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{therapyWeather.outdoor_therapy}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Atembedingungen</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{therapyWeather.breathing_conditions}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Bewegungstherapie</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{therapyWeather.movement_therapy.best_time}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Homöopathie & Naturheilkunde Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Homöopathie & Naturheilkunde</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {naturalMedicine && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Mondphase</p>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl text-gray-100">{naturalMedicine.moonphase.phase}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Schüßler-Salze</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-2xl text-gray-100">{naturalMedicine.schuessler_salts.primary}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Bach-Blüten</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl text-gray-100">{naturalMedicine.bach_flowers.recommendation}</span>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Naturheilkundliche Anwendungen</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {naturalMedicine.natural_remedies.map((remedy, index) => (
                      <span key={index} className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                        {remedy}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Luftqualität & Gesundheit Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium text-gray-200">Luftqualität & Gesundheit</CardTitle>
              <div 
                className="w-2 h-2 rounded-full bg-red-500"
                title="Daten von API"
              />
            </div>
          </CardHeader>
          <CardContent>
            {airQualityHealth && (
              <div className="space-y-6">
                {/* Hauptempfehlung */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Cloud className="h-6 w-6 text-blue-500" />
                    <p className="text-lg font-medium text-gray-200">Tagesempfehlung</p>
                  </div>
                  <p className="text-gray-300">{airQualityHealth.general_recommendation}</p>
                </div>

                {/* Gesundheitliche Auswirkungen */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Gesundheitliche Auswirkungen</h3>
                  <div className="grid gap-4">
                    {Object.entries(airQualityHealth.health_impacts).map(([group, impact]) => (
                      <div key={group} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {group === 'respiratory' ? (
                            <Wind className="h-4 w-4 text-cyan-500" />
                          ) : group === 'cardiovascular' ? (
                            <Heart className="h-4 w-4 text-red-500" />
                          ) : (
                            <Users className="h-4 w-4 text-yellow-500" />
                          )}
                          <p className="text-sm font-medium text-gray-300 capitalize">
                            {group === 'respiratory' ? 'Atemwege' :
                             group === 'cardiovascular' ? 'Herz-Kreislauf' :
                             'Risikogruppen'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">{impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aktivitätsempfehlungen */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Aktivitätsempfehlungen</h3>
                  <div className="grid gap-4">
                    {Object.entries(airQualityHealth.activity_recommendations)
                      .filter(([_, value]) => value !== undefined)
                      .map(([activity, recommendation]) => (
                      <div key={activity} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {activity === 'outdoor_sports' ? (
                            <Activity className="h-4 w-4 text-green-500" />
                          ) : activity === 'ventilation' ? (
                            <Wind className="h-4 w-4 text-blue-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <p className="text-sm font-medium text-gray-300">
                            {activity === 'outdoor_sports' ? 'Sport im Freien' :
                             activity === 'ventilation' ? 'Lüftung' :
                             'Schutzmaßnahmen'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schadstoff-Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Schadstoff-Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(airQualityHealth.pollutant_details).map(([pollutant, detail]) => (
                      <div key={pollutant} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {pollutant.includes('pm') ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : pollutant.includes('ozone') ? (
                            <Cloud className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Wind className="h-4 w-4 text-purple-500" />
                          )}
                          <p className="text-sm font-medium text-gray-300">
                            {pollutant.includes('pm25') ? 'Feinstaub PM2.5' :
                             pollutant.includes('pm10') ? 'Feinstaub PM10' :
                             pollutant.includes('ozone') ? 'Ozon' : 'Stickoxide'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 