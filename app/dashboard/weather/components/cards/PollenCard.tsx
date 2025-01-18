import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DataSourceIndicator } from '../common/DataSourceIndicator'
import { RiskBadge } from '../common/RiskBadge'

type PollenData = {
  alder?: number
  birch?: number
  grass?: number
  mugwort?: number
  ragweed?: number
}

interface PollenCardProps {
  pollenData: PollenData | null
  dataSource?: 'api' | 'db'
  onSourceToggle?: () => void
  isLoading?: boolean
}

export function PollenCard({ pollenData, dataSource = 'db', onSourceToggle, isLoading }: PollenCardProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-gray-200">Pollenflug</CardTitle>
        {dataSource && onSourceToggle && (
          <DataSourceIndicator source={dataSource} onToggle={onSourceToggle} disabled={isLoading} />
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Erle</p>
            <RiskBadge level={pollenData?.alder ?? -1} />
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Birke</p>
            <RiskBadge level={pollenData?.birch ?? -1} />
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Gräser</p>
            <RiskBadge level={pollenData?.grass ?? -1} />
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Beifuß</p>
            <RiskBadge level={pollenData?.mugwort ?? -1} />
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Ambrosia</p>
            <RiskBadge level={pollenData?.ragweed ?? -1} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 