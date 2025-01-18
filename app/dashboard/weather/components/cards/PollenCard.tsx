import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Pill } from 'lucide-react'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pollenflug</CardTitle>
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-blue-500" />
          {dataSource && onSourceToggle && (
            <DataSourceIndicator source={dataSource} onToggle={onSourceToggle} disabled={isLoading} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium">Erle</p>
            <RiskBadge level={pollenData?.alder ?? -1} />
          </div>
          <div>
            <p className="text-xs font-medium">Birke</p>
            <RiskBadge level={pollenData?.birch ?? -1} />
          </div>
          <div>
            <p className="text-xs font-medium">Gräser</p>
            <RiskBadge level={pollenData?.grass ?? -1} />
          </div>
          <div>
            <p className="text-xs font-medium">Beifuß</p>
            <RiskBadge level={pollenData?.mugwort ?? -1} />
          </div>
          <div>
            <p className="text-xs font-medium">Ambrosia</p>
            <RiskBadge level={pollenData?.ragweed ?? -1} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 