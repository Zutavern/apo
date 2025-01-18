import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, Sun, Moon, Wind, Droplets, CloudRain } from 'lucide-react'
import { DataSourceIndicator } from '../common/DataSourceIndicator'
import { getWeatherDescription } from '@/lib/utils'

interface ForecastData {
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

interface ForecastCardProps {
  forecastData: ForecastData | null
  dataSource: 'api' | 'db'
  onSourceToggle: () => void
  isLoading: boolean
}

export function ForecastCard({ forecastData, dataSource, onSourceToggle, isLoading }: ForecastCardProps) {
  // Funktion lokal definieren als Fallback
  const getWeatherText = (code: number): string => {
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

  if (!forecastData) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold text-gray-200">7-Tage-Vorhersage</CardTitle>
          <DataSourceIndicator source={dataSource} onToggle={onSourceToggle} disabled={isLoading} />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400">
            Keine Vorhersagedaten verfügbar
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formatiere das Datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }).format(date)
  }

  // Bestimme die Farbe für den UV-Index
  const getUvIndexColor = (uvIndex: number) => {
    if (uvIndex >= 8) return 'text-red-400 bg-red-400/10'
    if (uvIndex >= 6) return 'text-orange-400 bg-orange-400/10'
    if (uvIndex >= 3) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-green-400 bg-green-400/10'
  }

  // Wähle das passende Wettericon
  const getWeatherIcon = (code: number) => {
    if ([0, 1].includes(code)) return <Sun className="h-5 w-5 text-yellow-400" />
    if ([2, 3].includes(code)) return <Cloud className="h-5 w-5 text-gray-400" />
    if ([45, 48].includes(code)) return <Cloud className="h-5 w-5 text-gray-500" />
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) 
      return <CloudRain className="h-5 w-5 text-blue-400" />
    if ([71, 73, 75, 77, 85, 86].includes(code)) 
      return <CloudRain className="h-5 w-5 text-blue-200" />
    if ([95, 96, 99].includes(code)) 
      return <CloudRain className="h-5 w-5 text-yellow-500" />
    return <Cloud className="h-5 w-5 text-gray-400" />
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-gray-200">7-Tage-Vorhersage</CardTitle>
        <DataSourceIndicator source={dataSource} onToggle={onSourceToggle} disabled={isLoading} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {forecastData.daily.time.map((date, index) => (
            <div 
              key={date} 
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-200">
                  {formatDate(date)}
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 px-2 py-1 rounded">
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-200">
                    {forecastData.daily.temperature_2m_max[index].toFixed(1)}°
                  </span>
                  <span className="text-gray-500">/</span>
                  <Moon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">
                    {forecastData.daily.temperature_2m_min[index].toFixed(1)}°
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getWeatherIcon(forecastData.daily.weather_code[index])}
                  <span className="text-sm font-medium text-gray-200">
                    {getWeatherText(forecastData.daily.weather_code[index])}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-400">
                      {forecastData.daily.precipitation_sum[index].toFixed(1)} mm
                    </span>
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getUvIndexColor(forecastData.daily.uv_index_max[index])}`}>
                      UV {forecastData.daily.uv_index_max[index].toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 