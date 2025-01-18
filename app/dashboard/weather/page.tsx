'use client'

import { useState, useEffect } from 'react'
import { Cloud, Layout, LayoutGrid, Columns, Rows } from 'lucide-react'
import { CurrentWeatherCard } from './components/cards/CurrentWeatherCard'
import { PollenCard } from './components/cards/PollenCard'
import { ForecastCard } from './components/cards/ForecastCard'
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
  alder: number
  birch: number
  grass: number
  mugwort: number
  ragweed: number
}

type PollenApiResponse = {
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

type ForecastData = {
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

type LayoutType = 'single' | 'double' | 'triple';

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

function calculateMedicalWeatherData(weatherData: WeatherData, pollenData: PollenData | null): MedicalWeatherData {
  // Migräne-Index basierend auf Luftdruckänderungen
  const migraineIndex = Math.abs(weatherData.current.pressure_msl - 1013.25) > 10 ? 'Hoch' :
                       Math.abs(weatherData.current.pressure_msl - 1013.25) > 5 ? 'Mittel' : 'Niedrig'

  // Erkältungsrisiko basierend auf Temperatur und Luftfeuchtigkeit
  const coldRisk = weatherData.current.temperature_2m < 10 && weatherData.current.relative_humidity_2m > 70 ? 'Hoch' :
                  weatherData.current.temperature_2m < 15 && weatherData.current.relative_humidity_2m > 60 ? 'Mittel' : 'Niedrig'

  // Allergie-Warnung basierend auf Pollenflug
  const allergyAlert = pollenData && Object.values(pollenData).some(value => value > 4) ? 'Hoch' :
                      pollenData && Object.values(pollenData).some(value => value > 2) ? 'Mittel' : 'Niedrig'

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

const loadApiData = async () => {
  const response = await fetch('/api/weather/forecast/update')
  const data = await response.json()
  
  console.log('API Rohdaten:', data)
  
  if (!data?.success) {
    throw new Error('Keine gültigen Daten in der API-Antwort')
  }

  // Überprüfe, ob die Daten als Array vorliegen
  if (Array.isArray(data.data)) {
    // Konvertiere Array-Format in daily-Format
    const formattedData = {
      success: true,
      data: {
        daily: {
          time: data.data.map(d => d.date),
          temperature_2m_max: data.data.map(d => d.temperature_2m_max),
          temperature_2m_min: data.data.map(d => d.temperature_2m_min),
          precipitation_sum: data.data.map(d => d.precipitation_sum),
          weather_code: data.data.map(d => d.weather_code),
          sunrise: data.data.map(d => d.sunrise),
          sunset: data.data.map(d => d.sunset),
          uv_index_max: data.data.map(d => d.uv_index_max),
          pressure_msl_mean: data.data.map(d => d.pressure_msl_mean)
        }
      },
      last_updated: data.last_updated
    }
    return formattedData
  }
  
  // Falls die Daten bereits im korrekten Format vorliegen
  return data
}

const loadDbData = async () => {
  const response = await fetch('/api/weather/forecast/current');
  if (!response.ok) {
    throw new Error('Fehler beim Laden der DB-Daten');
  }
  return response.json();
};

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [pollenData, setPollenData] = useState<PollenData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [isLoadingPollen, setIsLoadingPollen] = useState(false)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  
  const [weatherDataSource, setWeatherDataSource] = useState<'api' | 'db'>('db')
  const [pollenDataSource, setPollenDataSource] = useState<'api' | 'db'>('db')
  const [forecastDataSource, setForecastDataSource] = useState<'api' | 'db'>('db')

  const [layoutType, setLayoutType] = useState<LayoutType>('double')

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      switch (current) {
        case 'single':
          return 'double'
        case 'double':
          return 'triple'
        case 'triple':
          return 'single'
        default:
          return 'double'
      }
    })
  }

  const handleUpdate = async () => {
    try {
      setIsLoadingWeather(true)
      setIsLoadingPollen(true)
      setIsLoadingForecast(true)
      setError(null)
      
      // Wetterdaten von der API laden und in DB speichern
      const updateResponse = await fetch('/api/weather/update')
      if (!updateResponse.ok) {
        throw new Error('Fehler beim Aktualisieren der Wetterdaten')
      }
      
      // Aktuelle Wetterdaten aus der DB laden
      const weatherResponse = await fetch('/api/weather/current')
      const weatherData = await weatherResponse.json()
      
      if (weatherData) {
        setWeatherData({
          current: {
            temperature_2m: weatherData.temperature_2m,
            relative_humidity_2m: weatherData.relative_humidity_2m,
            apparent_temperature: weatherData.apparent_temperature,
            precipitation: weatherData.precipitation,
            wind_speed_10m: weatherData.wind_speed_10m,
            weather_code: weatherData.weather_code,
            is_day: weatherData.is_day ? 1 : 0,
            uv_index: weatherData.uv_index,
            pressure_msl: weatherData.pressure_msl,
            surface_pressure: weatherData.surface_pressure
          },
          daily: {
            time: [new Date().toISOString().split('T')[0]],
            temperature_2m_max: [weatherData.temperature_2m + 2],
            temperature_2m_min: [weatherData.temperature_2m - 2],
            precipitation_sum: [weatherData.precipitation * 24],
            weather_code: [weatherData.weather_code],
            sunrise: [weatherData.sunrise],
            sunset: [weatherData.sunset],
            uv_index_max: [weatherData.uv_index],
            pressure_msl_mean: [weatherData.pressure_msl]
          }
        })
        if (weatherData.last_updated) {
          setLastUpdate(new Date(weatherData.last_updated))
        }
      }
      setIsLoadingWeather(false)

      // Pollen-Daten von der API laden und in DB speichern
      const pollenUpdateResponse = await fetch('/api/pollen/update')
      if (!pollenUpdateResponse.ok) {
        throw new Error('Fehler beim Aktualisieren der Pollendaten')
      }

      // Aktuelle Pollendaten aus der DB laden
      const pollenResponse = await fetch('/api/pollen/current')
      const pollenData = await pollenResponse.json()
      
      if (pollenData.success && pollenData.data) {
        setPollenData({
          alder: pollenData.data.alder || 0,
          birch: pollenData.data.birch || 0,
          grass: pollenData.data.grass || 0,
          mugwort: pollenData.data.mugwort || 0,
          ragweed: pollenData.data.ragweed || 0
        })
      }
      setIsLoadingPollen(false)

      // Vorhersage-Daten von der API laden und in DB speichern
      const forecastUpdateResponse = await fetch('/api/weather/forecast/update')
      if (!forecastUpdateResponse.ok) {
        throw new Error('Fehler beim Aktualisieren der Vorhersagedaten')
      }

      // Aktuelle Vorhersagedaten aus der DB laden
      const forecastResponse = await fetch('/api/weather/forecast/current')
      const forecastData = await forecastResponse.json()
      
      if (forecastData.success) {
        const formattedForecastData: ForecastData = {
          daily: {
            time: forecastData.data.daily?.time || [],
            temperature_2m_max: forecastData.data.daily?.temperature_2m_max || [],
            temperature_2m_min: forecastData.data.daily?.temperature_2m_min || [],
            precipitation_sum: forecastData.data.daily?.precipitation_sum || [],
            weather_code: forecastData.data.daily?.weather_code || [],
            sunrise: forecastData.data.daily?.sunrise || [],
            sunset: forecastData.data.daily?.sunset || [],
            uv_index_max: forecastData.data.daily?.uv_index_max || [],
            pressure_msl_mean: forecastData.data.daily?.pressure_msl_mean || []
          }
        }
        setForecastData(formattedForecastData)
      }

    } catch (error) {
      console.error('Fehler beim Update:', error)
      setError('Fehler beim Aktualisieren der Daten')
    } finally {
      setIsLoadingWeather(false)
      setIsLoadingPollen(false)
      setIsLoadingForecast(false)
    }
  }

  const loadDbData = async () => {
    try {
      setIsLoadingWeather(true)
      setIsLoadingPollen(true)
      setIsLoadingForecast(true)
      setError(null)

      // Lade aktuelle Wetterdaten
      const weatherResponse = await fetch('/api/weather/current')
      const weatherData = await weatherResponse.json()

      // Lade Pollendaten
      const pollenResponse = await fetch('/api/pollen/current')
      const pollenData = await pollenResponse.json()

      // Lade Vorhersagedaten
      const forecastResponse = await fetch('/api/weather/forecast/current')
      const forecastData = await forecastResponse.json()
      
      console.log('Raw Forecast DB Response:', forecastData)

      if (weatherData) {
        setWeatherData({
          current: {
            temperature_2m: weatherData.temperature_2m,
            relative_humidity_2m: weatherData.relative_humidity_2m,
            apparent_temperature: weatherData.apparent_temperature,
            precipitation: weatherData.precipitation,
            wind_speed_10m: weatherData.wind_speed_10m,
            weather_code: weatherData.weather_code,
            is_day: weatherData.is_day ? 1 : 0,
            uv_index: weatherData.uv_index,
            pressure_msl: weatherData.pressure_msl,
            surface_pressure: weatherData.surface_pressure
          },
          daily: {
            time: [new Date().toISOString().split('T')[0]],
            temperature_2m_max: [weatherData.temperature_2m + 2],
            temperature_2m_min: [weatherData.temperature_2m - 2],
            precipitation_sum: [weatherData.precipitation * 24],
            weather_code: [weatherData.weather_code],
            sunrise: [weatherData.sunrise],
            sunset: [weatherData.sunset],
            uv_index_max: [weatherData.uv_index],
            pressure_msl_mean: [weatherData.pressure_msl]
          }
        })
        if (weatherData.last_updated) {
          setLastUpdate(new Date(weatherData.last_updated))
        }
      }
      setIsLoadingWeather(false)

      if (pollenData.success && pollenData.data) {
        setPollenData({
          alder: pollenData.data.alder || 0,
          birch: pollenData.data.birch || 0,
          grass: pollenData.data.grass || 0,
          mugwort: pollenData.data.mugwort || 0,
          ragweed: pollenData.data.ragweed || 0
        })
      }
      setIsLoadingPollen(false)

      if (forecastData.success) {
        // Formatiere die Daten direkt im erwarteten Format
        const formattedForecastData: ForecastData = {
          daily: {
            time: forecastData.data.daily?.time || [],
            temperature_2m_max: forecastData.data.daily?.temperature_2m_max || [],
            temperature_2m_min: forecastData.data.daily?.temperature_2m_min || [],
            precipitation_sum: forecastData.data.daily?.precipitation_sum || [],
            weather_code: forecastData.data.daily?.weather_code || [],
            sunrise: forecastData.data.daily?.sunrise || [],
            sunset: forecastData.data.daily?.sunset || [],
            uv_index_max: forecastData.data.daily?.uv_index_max || [],
            pressure_msl_mean: forecastData.data.daily?.pressure_msl_mean || []
          }
        }

        console.log('Formatted DB Forecast Data:', formattedForecastData)
        setForecastData(formattedForecastData)
      } else {
        console.error('Keine Vorhersagedaten in der DB-Antwort:', forecastData)
        throw new Error('Keine Vorhersagedaten in der DB-Antwort')
      }

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoadingWeather(false)
      setIsLoadingPollen(false)
      setIsLoadingForecast(false)
    }
  }

  useEffect(() => {
    loadDbData()
  }, [])

  // Formatiere das aktuelle Datum
  const currentDate = new Date()
  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(currentDate)

  const handlePollenSourceToggle = async () => {
    try {
      setIsLoadingPollen(true)
      const newSource = pollenDataSource === 'api' ? 'db' : 'api'
      const endpoint = newSource === 'api' ? '/api/pollen/update' : '/api/pollen/current'
      
      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success && data.data) {
        setPollenData({
          alder: data.data.alder || 0,
          birch: data.data.birch || 0,
          grass: data.data.grass || 0,
          mugwort: data.data.mugwort || 0,
          ragweed: data.data.ragweed || 0
        })
        setPollenDataSource(newSource)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Pollendaten:', error)
    } finally {
      setIsLoadingPollen(false)
    }
  }

  const handleWeatherSourceToggle = async () => {
    try {
      setIsLoadingWeather(true)
      const newSource = weatherDataSource === 'api' ? 'db' : 'api'
      const endpoint = newSource === 'api' ? '/api/weather/update' : '/api/weather/current'
      
      const response = await fetch(endpoint)
      const data = await response.json()

      if (data) {
        setWeatherData({
          current: {
            temperature_2m: data.temperature_2m,
            relative_humidity_2m: data.relative_humidity_2m,
            apparent_temperature: data.apparent_temperature,
            precipitation: data.precipitation,
            wind_speed_10m: data.wind_speed_10m,
            weather_code: data.weather_code,
            is_day: data.is_day ? 1 : 0,
            uv_index: data.uv_index,
            pressure_msl: data.pressure_msl,
            surface_pressure: data.surface_pressure
          },
          daily: {
            time: [new Date().toISOString().split('T')[0]],
            temperature_2m_max: [data.temperature_2m + 2],
            temperature_2m_min: [data.temperature_2m - 2],
            precipitation_sum: [data.precipitation * 24],
            weather_code: [data.weather_code],
            sunrise: [data.sunrise],
            sunset: [data.sunset],
            uv_index_max: [data.uv_index],
            pressure_msl_mean: [data.pressure_msl]
          }
        })
        if (data.last_updated) {
          setLastUpdate(new Date(data.last_updated))
        }
        setWeatherDataSource(newSource)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Wetterdaten:', error)
    } finally {
      setIsLoadingWeather(false)
    }
  }

  const handleForecastSourceToggle = async () => {
    setIsLoadingForecast(true);
    try {
      const newSource = forecastDataSource === 'api' ? 'db' : 'api';
      console.log('Toggle Quelle zu:', newSource);
      
      const data = await (newSource === 'api' 
        ? loadApiData()
        : (async () => {
            const response = await fetch('/api/weather/forecast/current');
            return response.json();
          })()
      );
      
      console.log('Rohdaten vom Server:', JSON.stringify(data, null, 2));
      
      if (!data?.success || !data?.data) {
        console.error('Keine gültigen Daten in der Antwort:', data);
        throw new Error('Keine Vorhersagedaten in der Antwort');
      }
      
      if (!data.data.daily) {
        console.error('Keine daily-Daten in der Antwort:', data.data);
        throw new Error('Keine daily-Daten in der Antwort');
      }
      
      // Formatiere die Daten als ForecastData-Objekt
      const formattedData: ForecastData = {
        daily: {
          time: data.data.daily?.time || [],
          temperature_2m_max: data.data.daily?.temperature_2m_max || [],
          temperature_2m_min: data.data.daily?.temperature_2m_min || [],
          precipitation_sum: data.data.daily?.precipitation_sum || [],
          weather_code: data.data.daily?.weather_code || [],
          sunrise: data.data.daily?.sunrise || [],
          sunset: data.data.daily?.sunset || [],
          uv_index_max: data.data.daily?.uv_index_max || [],
          pressure_msl_mean: data.data.daily?.pressure_msl_mean || []
        }
      };
      
      console.log('Formatierte Daten:', JSON.stringify(formattedData, null, 2));
      setForecastData(formattedData);
      setForecastDataSource(newSource);
      
      if (data.last_updated) {
        console.log('Setze letztes Update auf:', new Date(data.last_updated));
        setLastUpdate(new Date(data.last_updated));
      }
      
    } catch (error) {
      console.error('Fehler beim Laden der Vorhersagedaten:', error);
      setError('Fehler beim Laden der Vorhersagedaten');
    } finally {
      setIsLoadingForecast(false);
    }
  };

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

  console.log('Current State:', {
    isLoading: isLoadingWeather || isLoadingPollen || isLoadingForecast,
    error,
    weatherData: weatherData ? JSON.stringify(weatherData, null, 2) : null
  })

  if (isLoadingWeather || isLoadingPollen || isLoadingForecast) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Aktuelles Wetter in Hohenmölsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={() => {}}
            disabled
          >
            <Cloud className="h-4 w-4 text-blue-500" />
            <span>Update Daten</span>
          </button>
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
              Aktuelles Wetter in Hohenmölsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleUpdate}
          >
            <Cloud className="h-4 w-4 text-blue-500" />
            <span>Update Daten</span>
          </button>
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
              Aktuelles Wetter in Hohenmölsen am {formattedDate}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} Uhr
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleUpdate}
          >
            <Cloud className="h-4 w-4 text-blue-500" />
            <span>Update Daten</span>
          </button>
        </div>
        <div className="text-center text-red-500">
          Keine Wetterdaten verfügbar
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Aktuelles Wetter in Hohenmölsen am {formattedDate}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })} Uhr
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleLayoutToggle}
          >
            {layoutType === 'single' ? (
              <Rows className="h-4 w-4 text-blue-500" />
            ) : layoutType === 'double' ? (
              <Columns className="h-4 w-4 text-blue-500" />
            ) : (
              <LayoutGrid className="h-4 w-4 text-blue-500" />
            )}
            <span>{layoutType === 'single' ? '1 Spalte' : layoutType === 'double' ? '2 Spalten' : '3 Spalten'}</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            onClick={handleUpdate}
            disabled={isLoadingWeather || isLoadingPollen || isLoadingForecast}
          >
            <Cloud className={`h-4 w-4 text-blue-500 ${(isLoadingWeather || isLoadingPollen || isLoadingForecast) ? 'animate-spin' : ''}`} />
            <span>{(isLoadingWeather || isLoadingPollen || isLoadingForecast) ? 'Wird aktualisiert...' : 'Update Daten'}</span>
          </button>
        </div>
      </div>
      <div className={`grid gap-4 ${
        layoutType === 'single' 
          ? 'grid-cols-1' 
          : layoutType === 'double'
          ? 'md:grid-cols-2'
          : 'md:grid-cols-3'
      }`}>
        <CurrentWeatherCard 
          weatherData={weatherData} 
          dataSource={weatherDataSource} 
          onSourceToggle={handleWeatherSourceToggle}
          isLoading={isLoadingWeather}
        />
        <PollenCard 
          pollenData={pollenData}
          dataSource={pollenDataSource}
          onSourceToggle={handlePollenSourceToggle}
          isLoading={isLoadingPollen}
        />
        {layoutType === 'triple' ? (
          <ForecastCard
            forecastData={forecastData}
            dataSource={forecastDataSource}
            onSourceToggle={handleForecastSourceToggle}
            isLoading={isLoadingForecast}
          />
        ) : (
          <div className={`${layoutType === 'single' ? 'col-span-1' : 'col-span-2'}`}>
            <ForecastCard
              forecastData={forecastData}
              dataSource={forecastDataSource}
              onSourceToggle={handleForecastSourceToggle}
              isLoading={isLoadingForecast}
            />
          </div>
        )}
      </div>
    </div>
  )
} 