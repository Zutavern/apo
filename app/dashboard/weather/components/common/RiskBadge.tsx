interface RiskBadgeProps {
  level: number
}

export function RiskBadge({ level }: RiskBadgeProps) {
  if (level === -1) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-700/50 text-gray-400 text-sm">
        N/A
      </span>
    )
  }

  const getColorClasses = (level: number) => {
    if (level >= 4) return 'bg-red-500/20 text-red-400'
    if (level >= 2) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-green-500/20 text-green-400'
  }

  const getRiskText = (level: number) => {
    if (level >= 4) return 'Hoch'
    if (level >= 2) return 'Mittel'
    return 'Niedrig'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded ${getColorClasses(level)}`}>
      {getRiskText(level)}
    </span>
  )
} 