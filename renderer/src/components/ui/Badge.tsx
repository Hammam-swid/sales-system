import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

// Each pair is a status color on its own tint, so contrast holds in both themes.
const TONES: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-blue-50 text-blue-800',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger'
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'type-label-strong inline-flex items-center rounded-pill px-3 py-0.5',
        TONES[tone]
      )}
    >
      {children}
    </span>
  )
}
