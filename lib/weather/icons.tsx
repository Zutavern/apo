import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, type LucideIcon } from 'lucide-react'

export function getWeatherIcon(code: number): LucideIcon {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  switch (code) {
    case 0: // Clear sky
      return Sun
    case 1: // Mainly clear
    case 2: // Partly cloudy
    case 3: // Overcast
      return Cloud
    case 45: // Foggy
    case 48: // Depositing rime fog
      return CloudFog
    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
      return CloudDrizzle
    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return CloudRain
    case 71: // Slight snow fall
    case 73: // Moderate snow fall
    case 75: // Heavy snow fall
    case 77: // Snow grains
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return CloudSnow
    case 95: // Thunderstorm
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return CloudLightning
    default:
      return Cloud
  }
} 