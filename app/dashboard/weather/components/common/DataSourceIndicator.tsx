import { Switch } from '@/components/ui/switch'

interface DataSourceIndicatorProps {
  source: 'api' | 'db'
  onToggle?: () => void
  disabled?: boolean
}

export function DataSourceIndicator({ source, onToggle, disabled = false }: DataSourceIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          source === 'api' ? 'bg-green-400' : 'bg-blue-400'
        }`}
        title={source === 'api' ? 'Direkt von der API' : 'Aus der Datenbank'}
      />
      <Switch
        checked={source === 'db'}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-blue-400 data-[state=unchecked]:bg-gray-700"
      />
    </div>
  )
} 