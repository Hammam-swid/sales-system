import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface StatTileProps {
  label: string
  value: ReactNode
  // Secondary line under the value.
  hint?: ReactNode
  // Makes this the headline figure of its row.
  emphasis?: boolean
}

// A single headline number. The figure stays in ink; color is never the only signal.
export function StatTile({ label, value, hint, emphasis = false }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-5 py-4',
        emphasis ? 'border-primary bg-bg' : 'border-border bg-surface'
      )}
    >
      <p className="type-caption text-ink-muted">{label}</p>
      <p className={cn('text-ink tabular-nums', emphasis ? 'type-h2' : 'type-h3')}>{value}</p>
      {hint && <p className="type-caption text-ink-muted">{hint}</p>}
    </div>
  )
}
