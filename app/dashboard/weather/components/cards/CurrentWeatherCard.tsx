import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Cloud, Thermometer, Wind, Droplets, Sun, Moon, CloudRain } from 'lucide-react'
import { WeatherData } from '../../types'
import { DataSourceIndicator } from '../common/DataSourceIndicator'
import { getWeatherDescription } from '../../utils'

interface CurrentWeatherCardProps {
  weatherData: WeatherData
  dataSource: 'api' | 'db'
  onSourceToggle?: () => void
  isLoading?: boolean
}

export function CurrentWeatherCard({ 
  weatherData, 
  dataSource, 
  onSourceToggle,
  isLoading = false 
}: CurrentWeatherCardProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">Aktuelles Wetter</CardTitle>
        <DataSourceIndicator 
          source={dataSource} 
          onToggle={onSourceToggle}
          disabled={isLoading}
        />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center space-x-4">
              <Cloud className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {weatherData.current.temperature_2m.toFixed(1)}°C
                </p>
                <p className="text-sm text-gray-400">
                  {getWeatherDescription(weatherData.current.weather_code)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">Gefühlt</span>
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-gray-200">
                  {weatherData.current.apparent_temperature.toFixed(1)}°C
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">Wind</span>
              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">
                  {weatherData.current.wind_speed_10m.toFixed(1)} km/h
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">Luftfeuchte</span>
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">
                  {weatherData.current.relative_humidity_2m}%
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">Niederschlag</span>
              <div className="flex items-center space-x-2">
                <CloudRain className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">
                  {weatherData.current.precipitation} mm
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">UV-Index</span>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-yellow-400" />
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  weatherData.current.uv_index <= 2 ? 'bg-green-500/20 text-green-400' :
                  weatherData.current.uv_index <= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                  weatherData.current.uv_index <= 7 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {weatherData.current.uv_index.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1 bg-gray-800/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-400">Luftdruck</span>
              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-200">
                  {weatherData.current.pressure_msl} hPa
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2">
              {weatherData.current.is_day ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-blue-300" />
              )}
              <span className="text-sm text-gray-200">
                {weatherData.current.is_day ? 'Tag' : 'Nacht'}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {weatherData.current.is_day ? 
                `Sonnenuntergang: ${new Date(weatherData.daily.sunset[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` :
                `Sonnenaufgang: ${new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 