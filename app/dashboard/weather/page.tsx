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
  Clock
} from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNightMode, setIsNightMode] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Wetterdaten abrufen
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,is_day,weather_code,uv_index,pressure_msl,surface_pressure,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset,uv_index_max&timezone=Europe%2FBerlin`
        )

        // Pollendaten abrufen
        const pollenResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&hourly=dust,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen`
        )

        // Luftqualitätsdaten abrufen
        const airQualityResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${HOHENMOLSEN_COORDS.latitude}&longitude=${HOHENMOLSEN_COORDS.longitude}&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi`
        )

        if (!weatherResponse.ok || !pollenResponse.ok || !airQualityResponse.ok) {
          throw new Error('Fehler beim Abrufen der Daten')
        }

        const [weatherData, pollenData, airQualityData] = await Promise.all([
          weatherResponse.json(),
          pollenResponse.json(),
          airQualityResponse.json()
        ])

        setWeatherData(weatherData)
        setPollenData(pollenData)
        setAirQualityData(airQualityData)
      } catch (err) {
        console.error('Fetch Error:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

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
    isLoading,
    error,
    weatherData: weatherData ? JSON.stringify(weatherData, null, 2) : null
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-gray-500">
          Wetterdaten werden geladen...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-red-500">
          Fehler: {error}
        </div>
      </div>
    )
  }

  if (!weatherData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-8">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <div className="text-center text-red-500">
          Keine Wetterdaten verfügbar
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Wetter in Hohenmölsen am {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
      </div>
      
      {weatherData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Aktuelles Wetter */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Cloud className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-medium">Aktuelles Wetter</h2>
              </div>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })} Uhr
              </div>
            </div>

            {/* Hauptanzeige */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-4">
                  {weatherData.current.is_day ? (
                    <Sun className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <Moon className="h-12 w-12 text-blue-300" />
                  )}
                  <div>
                    <div className="text-3xl font-bold">{weatherData.current.temperature_2m}°C</div>
                    <div className="text-gray-400">{getWeatherDescription(weatherData.current.weather_code)}</div>
                  </div>
                </div>
                <div className="flex-1 flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Gefühlt wie</div>
                    <div className="text-xl font-medium">{weatherData.current.apparent_temperature}°C</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-400">Luftfeuchte</div>
                </div>
                <div className="text-xl font-medium">{weatherData.current.relative_humidity_2m}%</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-400">Wind</div>
                </div>
                <div className="text-xl font-medium">{weatherData.current.wind_speed_10m} km/h</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-400">Regen</div>
                </div>
                <div className="text-xl font-medium">{weatherData.current.precipitation} mm</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-400">Luftdruck</div>
                </div>
                <div className="text-xl font-medium">{weatherData.current.pressure_msl} hPa</div>
              </div>
            </div>

            {/* UV-Index und Sonnenzeiten */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <div className="text-sm text-gray-400">UV-Index</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xl font-medium">{weatherData.current.uv_index}</div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    weatherData.current.uv_index <= 2 ? 'bg-green-500/20 text-green-500' :
                    weatherData.current.uv_index <= 5 ? 'bg-yellow-500/20 text-yellow-500' :
                    weatherData.current.uv_index <= 7 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {weatherData.current.uv_index <= 2 ? 'Niedrig' :
                     weatherData.current.uv_index <= 5 ? 'Mittel' :
                     weatherData.current.uv_index <= 7 ? 'Hoch' : 'Sehr hoch'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div className="text-sm text-gray-400">Sonnenzeiten</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <div className="text-sm text-gray-400">Aufgang</div>
                    </div>
                    <div className="text-xl font-medium">
                      {new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-blue-300" />
                      <div className="text-sm text-gray-400">Untergang</div>
                    </div>
                    <div className="text-xl font-medium">
                      {new Date(weatherData.daily.sunset[0]).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gesundheitsindices */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-6 w-6 text-yellow-500" />
              <h2 className="text-lg font-medium">Gesundheitsindices</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span>UV-Index</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded ${
                    weatherData.current.uv_index <= 2 ? 'bg-green-500/20 text-green-500' :
                    weatherData.current.uv_index <= 5 ? 'bg-yellow-500/20 text-yellow-500' :
                    weatherData.current.uv_index <= 7 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {weatherData.current.uv_index.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  <span>Gefühlt</span>
                </div>
                <span className="font-medium">{weatherData.current.apparent_temperature}°C</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <span>Luftdruck</span>
                </div>
                <span className="font-medium">{weatherData.current.pressure_msl} hPa</span>
              </div>
            </div>
          </div>

          {/* Pollenflug-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Flower className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-medium">Pollenflug</h2>
            </div>
            <div className="space-y-4">
              {pollenData && Object.entries(getCurrentPollenData(pollenData) || {}).map(([pollen, value]) => (
                <div key={pollen} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span className="capitalize">
                    {pollen === 'alder' ? 'Erle' :
                     pollen === 'birch' ? 'Birke' :
                     pollen === 'grass' ? 'Gräser' :
                     pollen === 'mugwort' ? 'Beifuß' :
                     'Ambrosia'}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    value === 0 ? 'bg-green-500/20 text-green-500' :
                    value <= 2 ? 'bg-yellow-500/20 text-yellow-500' :
                    value <= 4 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {value === 0 ? 'Keine' :
                     value <= 2 ? 'Gering' :
                     value <= 4 ? 'Mittel' :
                     'Hoch'}
                  </span>
                </div>
              ))}
              {!pollenData && (
                <div className="text-center text-gray-400 p-4">
                  Keine Pollendaten verfügbar
                </div>
              )}
            </div>
          </div>

          {/* Biometeorologie-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-medium">Biometeorologie</h2>
            </div>
            <div className="space-y-4">
              {biometeoData && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Kreislaufbelastung</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.circulatory_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.circulatory_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.circulatory_stress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Kopfschmerz-Risiko</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.headache_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.headache_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.headache_risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Rheuma-Belastung</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.rheumatic_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.rheumatic_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.rheumatic_stress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Asthma-Risiko</span>
                    <span className={`px-2 py-1 rounded ${
                      biometeoData.asthma_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      biometeoData.asthma_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {biometeoData.asthma_risk}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Luftqualität-Karte */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Wind className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-medium">Luftqualität</h2>
            </div>
            <div className="space-y-4">
              {airQualityData && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Luftqualitätsindex</span>
                    <span className={`px-2 py-1 rounded ${
                      airQualityData.current.european_aqi <= 20 ? 'bg-green-500/20 text-green-500' :
                      airQualityData.current.european_aqi <= 40 ? 'bg-yellow-500/20 text-yellow-500' :
                      airQualityData.current.european_aqi <= 60 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {airQualityData.current.european_aqi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Feinstaub (PM2.5)</span>
                    <span className="font-medium">{airQualityData.current.pm2_5} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Feinstaub (PM10)</span>
                    <span className="font-medium">{airQualityData.current.pm10} µg/m³</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Ozon</span>
                    <span className="font-medium">{airQualityData.current.ozone} µg/m³</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gesundheitsempfehlungen */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Gesundheitsempfehlungen</h2>
            </div>
            <div className="grid gap-4">
              {healthRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-4">
                    {rec.type === 'UV' && <Sun className="h-5 w-5 text-yellow-500" />}
                    {rec.type === 'Temperature' && <Thermometer className="h-5 w-5 text-red-500" />}
                    {rec.type === 'Hydration' && <Droplets className="h-5 w-5 text-blue-500" />}
                    {rec.type === 'Pollen' && <Flower className="h-5 w-5 text-green-500" />}
                    <span className="text-gray-400">{rec.recommendation}</span>
                  </div>
                  <span className={`px-2 py-1 rounded ${
                    rec.risk_level === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                    rec.risk_level === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {rec.risk_level}
                  </span>
                </div>
              ))}
              {healthRecommendations.length === 0 && (
                <div className="text-center text-gray-400 p-4">
                  Keine besonderen Gesundheitsempfehlungen für heute
                </div>
              )}
            </div>
          </div>

          {/* 7-Tage Vorhersage */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">7-Tage Vorhersage</h2>
            </div>
            <div className="grid gap-4">
              {weatherData.daily.time.map((date, index) => (
                <div key={date} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-gray-400">
                      {getWeatherDescription(weatherData.daily.weather_code[index])}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-500">{weatherData.daily.temperature_2m_min[index]}°C</span>
                    <span>-</span>
                    <span className="text-red-500">{weatherData.daily.temperature_2m_max[index]}°C</span>
                    <span className="text-gray-400">{weatherData.daily.precipitation_sum[index]} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apotheken-spezifische Karten */}
      {weatherData && (
        <section className="grid gap-6 md:grid-cols-2">
          {/* Medizinische Wetterwarnungen */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-medium">Medizinische Wetterwarnungen</h2>
            </div>
            {medicalWeatherData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span>Migräne-Index</span>
                  <span className={`px-2 py-1 rounded ${
                    medicalWeatherData.migraineIndex === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                    medicalWeatherData.migraineIndex === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {medicalWeatherData.migraineIndex}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span>Allergie-Warnung</span>
                  <span className={`px-2 py-1 rounded ${
                    medicalWeatherData.allergyAlert === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                    medicalWeatherData.allergyAlert === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {medicalWeatherData.allergyAlert}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span>Erkältungsrisiko</span>
                  <span className={`px-2 py-1 rounded ${
                    medicalWeatherData.coldRisk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                    medicalWeatherData.coldRisk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {medicalWeatherData.coldRisk}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gesundheitsvorsorge */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Gesundheitsvorsorge</h2>
            </div>
            {medicalWeatherData && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">UV-Schutz</h3>
                  <p className="text-sm text-gray-400">{medicalWeatherData.recommendations.sunProtection}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">Medikationsempfehlung</h3>
                  <p className="text-sm text-gray-400">{medicalWeatherData.recommendations.medication}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">Präventionsmaßnahmen</h3>
                  <p className="text-sm text-gray-400">{medicalWeatherData.recommendations.prevention}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Neue Gesundheitskarten */}
      {weatherData && (
        <>
          {/* Saisonale Gesundheitskarte */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-purple-500" />
                <h2 className="text-lg font-medium">Saisonale Gesundheit</h2>
              </div>
              {seasonalHealth && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <span>Grippesaison-Risiko</span>
                    <span className={`px-2 py-1 rounded ${
                      seasonalHealth.fluSeason === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      seasonalHealth.fluSeason === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {seasonalHealth.fluSeason}
                    </span>
                  </div>
                  {seasonalHealth.seasonalAllergies.length > 0 && (
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <h3 className="font-medium mb-2">Aktuelle Allergene</h3>
                      <p className="text-sm text-gray-400">{seasonalHealth.seasonalAllergies.join(', ')}</p>
                    </div>
                  )}
                  {seasonalHealth.vaccineRecommendations.length > 0 && (
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <h3 className="font-medium mb-2">Impfempfehlungen</h3>
                      <div className="space-y-2">
                        {seasonalHealth.vaccineRecommendations.map((rec, index) => (
                          <p key={index} className="text-sm text-gray-400">{rec}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chronische Erkrankungen */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="h-6 w-6 text-red-500" />
                <h2 className="text-lg font-medium">Chronische Erkrankungen</h2>
              </div>
              {chronicConditionIndex && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span>COPD-Belastung</span>
                      <span className={`px-2 py-1 rounded ${
                        chronicConditionIndex.copd_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                        chronicConditionIndex.copd_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {chronicConditionIndex.copd_risk}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{chronicConditionIndex.recommendations.copd}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span>Rheuma-Belastung</span>
                      <span className={`px-2 py-1 rounded ${
                        chronicConditionIndex.rheumatic_load === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                        chronicConditionIndex.rheumatic_load === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {chronicConditionIndex.rheumatic_load}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{chronicConditionIndex.recommendations.rheumatic}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span>Herz-Kreislauf-Belastung</span>
                      <span className={`px-2 py-1 rounded ${
                        chronicConditionIndex.cardiovascular_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                        chronicConditionIndex.cardiovascular_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {chronicConditionIndex.cardiovascular_stress}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{chronicConditionIndex.recommendations.cardiovascular}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Medikamenten-Timing */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Medikamenten-Timing</h2>
            </div>
            {medicationTiming && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">Optimale Einnahmezeiten</h3>
                  {Object.entries(medicationTiming.optimal_times).map(([time, recommendation]) => (
                    <div key={time} className="flex justify-between items-center mb-2">
                      <span className="capitalize">{time}</span>
                      <span className="text-sm text-gray-400">{recommendation}</span>
                    </div>
                  ))}
                </div>
                {medicationTiming.uv_warnings.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">UV-Warnungen</h3>
                    <div className="space-y-2">
                      {medicationTiming.uv_warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-gray-400">{warning}</p>
                      ))}
                    </div>
                  </div>
                )}
                {medicationTiming.storage_recommendations.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Lagerungsempfehlungen</h3>
                    <div className="space-y-2">
                      {medicationTiming.storage_recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-gray-400">{rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seniorengesundheit */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-medium">Seniorengesundheit</h2>
            </div>
            {seniorHealth && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span>Sturzrisiko</span>
                    <span className={`px-2 py-1 rounded ${
                      seniorHealth.fall_risk === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      seniorHealth.fall_risk === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {seniorHealth.fall_risk}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{seniorHealth.recommendations.mobility}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span>Temperaturbelastung</span>
                    <span className={`px-2 py-1 rounded ${
                      seniorHealth.temperature_stress === 'Niedrig' ? 'bg-green-500/20 text-green-500' :
                      seniorHealth.temperature_stress === 'Mittel' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {seniorHealth.temperature_stress}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{seniorHealth.recommendations.protection}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span>Aktivität im Freien</span>
                    <span className={`px-2 py-1 rounded ${
                      seniorHealth.outdoor_activity === 'Empfohlen' ? 'bg-green-500/20 text-green-500' :
                      seniorHealth.outdoor_activity === 'Mit Vorsicht' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {seniorHealth.outdoor_activity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{seniorHealth.recommendations.activity}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Neue Therapie-Karten */}
      {weatherData && (
        <section className="grid gap-6 md:grid-cols-2">
          {/* Heilpflanzen & Kräuter */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Flower className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-medium">Heilpflanzen & Kräuter</h2>
            </div>
            {herbalMedicine && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">Optimale Sammelzeiten</h3>
                  {Object.entries(herbalMedicine.collection_times).map(([time, info]) => (
                    <div key={time} className="flex justify-between items-center mb-2">
                      <span className="capitalize">{time}</span>
                      <span className="text-sm text-gray-400">{info}</span>
                    </div>
                  ))}
                </div>
                {herbalMedicine.storage_conditions.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Lagerung</h3>
                    <div className="space-y-2">
                      {herbalMedicine.storage_conditions.map((condition, index) => (
                        <p key={index} className="text-sm text-gray-400">{condition}</p>
                      ))}
                    </div>
                  </div>
                )}
                {herbalMedicine.seasonal_herbs.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Saisonale Heilpflanzen</h3>
                    <div className="space-y-2">
                      {herbalMedicine.seasonal_herbs.map((herbs, index) => (
                        <p key={index} className="text-sm text-gray-400">{herbs}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Therapie-Wetter */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-medium">Therapie-Wetter</h2>
            </div>
            {therapyWeather && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span>Outdoor-Therapie</span>
                    <span className={`px-2 py-1 rounded ${
                      therapyWeather.outdoor_therapy === 'Optimal' ? 'bg-green-500/20 text-green-500' :
                      therapyWeather.outdoor_therapy === 'Bedingt möglich' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {therapyWeather.outdoor_therapy}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span>Atembedingungen</span>
                    <span className={`px-2 py-1 rounded ${
                      therapyWeather.breathing_conditions === 'Günstig' ? 'bg-green-500/20 text-green-500' :
                      therapyWeather.breathing_conditions === 'Neutral' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {therapyWeather.breathing_conditions}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-2">Bewegungstherapie</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Beste Zeit</span>
                      <span className="text-sm text-gray-400">{therapyWeather.movement_therapy.best_time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Intensität</span>
                      <span className={`px-2 py-1 rounded ${
                        therapyWeather.movement_therapy.intensity === 'Hoch' ? 'bg-green-500/20 text-green-500' :
                        therapyWeather.movement_therapy.intensity === 'Moderat' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {therapyWeather.movement_therapy.intensity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Empfohlener Ort</span>
                      <span className="text-sm text-gray-400">{therapyWeather.movement_therapy.location}</span>
                    </div>
                  </div>
                </div>
                {therapyWeather.recommendations.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Empfehlungen</h3>
                    <div className="space-y-2">
                      {therapyWeather.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-gray-400">{rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Homöopathie & Naturheilkunde */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Flower className="h-6 w-6 text-purple-500" />
          <h2 className="text-lg font-medium">Homöopathie & Naturheilkunde</h2>
        </div>
        {naturalMedicine && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Mondphase: {naturalMedicine.moonphase.phase}</h3>
              <p className="text-sm text-gray-400">{naturalMedicine.moonphase.recommendation}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Schüßler-Salze</h3>
              <div className="space-y-2">
                <p className="text-sm">Primär: {naturalMedicine.schuessler_salts.primary}</p>
                <p className="text-sm">Ergänzend: {naturalMedicine.schuessler_salts.secondary}</p>
                <p className="text-sm text-gray-400">{naturalMedicine.schuessler_salts.reason}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Bach-Blüten</h3>
              <p className="text-sm">{naturalMedicine.bach_flowers.recommendation}</p>
              <p className="text-sm text-gray-400">{naturalMedicine.bach_flowers.reason}</p>
            </div>
            {naturalMedicine.natural_remedies.length > 0 && (
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h3 className="font-medium mb-2">Naturheilkundliche Anwendungen</h3>
                <div className="space-y-2">
                  {naturalMedicine.natural_remedies.map((remedy, index) => (
                    <p key={index} className="text-sm text-gray-400">{remedy}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Luftqualität & Gesundheit */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wind className="h-6 w-6 text-green-500" />
          <h2 className="text-lg font-medium">Luftqualität & Gesundheit</h2>
        </div>
        {airQualityHealth && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Allgemeine Empfehlung</h3>
              <p className="text-sm text-gray-400">{airQualityHealth.general_recommendation}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Gesundheitliche Auswirkungen</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">{airQualityHealth.health_impacts.respiratory}</p>
                <p className="text-sm text-gray-400">{airQualityHealth.health_impacts.cardiovascular}</p>
                <p className="text-sm text-gray-400">{airQualityHealth.health_impacts.sensitive_groups}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Aktivitätsempfehlungen</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">{airQualityHealth.activity_recommendations.outdoor_sports}</p>
                <p className="text-sm text-gray-400">{airQualityHealth.activity_recommendations.ventilation}</p>
                {airQualityHealth.activity_recommendations.mask_recommendation && (
                  <p className="text-sm text-gray-400">{airQualityHealth.activity_recommendations.mask_recommendation}</p>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="font-medium mb-2">Schadstoff-Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">{airQualityHealth.pollutant_details.pm25_impact}</p>
                <p className="text-sm text-gray-400">{airQualityHealth.pollutant_details.pm10_impact}</p>
                <p className="text-sm text-gray-400">{airQualityHealth.pollutant_details.ozone_impact}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tag/Nacht Anzeige */}
      <div className="flex justify-end mt-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
          {weatherData.current.is_day ? (
            <>
              <Sun className="h-5 w-5 text-yellow-500" />
              <span>Tag-Modus</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-blue-300" />
              <span>Nacht-Modus</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 