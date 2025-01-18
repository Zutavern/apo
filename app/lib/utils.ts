export function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: 'Klar',
    1: 'Überwiegend klar',
    2: 'Teilweise bewölkt',
    3: 'Bedeckt',
    45: 'Neblig',
    48: 'Dichter Nebel',
    51: 'Leichter Nieselregen',
    53: 'Mäßiger Nieselregen',
    55: 'Starker Nieselregen',
    56: 'Leichter gefrierender Nieselregen',
    57: 'Starker gefrierender Nieselregen',
    61: 'Leichter Regen',
    63: 'Mäßiger Regen',
    65: 'Starker Regen',
    66: 'Leichter gefrierender Regen',
    67: 'Starker gefrierender Regen',
    71: 'Leichter Schneefall',
    73: 'Mäßiger Schneefall',
    75: 'Starker Schneefall',
    77: 'Schneegriesel',
    80: 'Leichte Regenschauer',
    81: 'Mäßige Regenschauer',
    82: 'Starke Regenschauer',
    85: 'Leichte Schneeschauer',
    86: 'Starke Schneeschauer',
    95: 'Gewitter',
    96: 'Gewitter mit leichtem Hagel',
    99: 'Gewitter mit starkem Hagel'
  }

  return weatherCodes[code] || 'Unbekannt'
} 