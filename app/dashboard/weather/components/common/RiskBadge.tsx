interface RiskBadgeProps {
  level: number
}

export function RiskBadge({ level }: RiskBadgeProps) {
  if (level === -1) {
    return (
      <span className="inline-flex items-center rounded-md bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-500/20">
        N/A
      </span>
    )
  }

  const color = level >= 4 ? 'red' : level >= 2 ? 'yellow' : 'green'
  const text = level >= 4 ? 'Hoch' : level >= 2 ? 'Mittel' : 'Niedrig'

  const colors = {
    red: 'bg-red-500/10 text-red-400 ring-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    green: 'bg-green-500/10 text-green-400 ring-green-500/20'
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[color]}`}>
      {text}
    </span>
  )
} 