import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Aktuelles Wetter</CardTitle>
        <DataSourceIndicator 
          source={dataSource} 
          onToggle={onSourceToggle}
          disabled={isLoading}
        />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Cloud className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {weatherData.current.temperature_2m.toFixed(1)}°C
                </p>
                <p className="text-sm text-gray-500">
                  {getWeatherDescription(weatherData.current.weather_code)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-1">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {weatherData.current.apparent_temperature.toFixed(1)}°C
              </span>
              <span className="text-xs text-gray-500">Gefühlt</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Wind className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {weatherData.current.wind_speed_10m.toFixed(1)} km/h
              </span>
              <span className="text-xs text-gray-500">Wind</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {weatherData.current.relative_humidity_2m}%
              </span>
              <span className="text-xs text-gray-500">Luftfeuchte</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 