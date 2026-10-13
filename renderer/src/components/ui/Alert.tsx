import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '../../lib/cn'

type Tone = 'danger' | 'success'

const TONES: Record<Tone, string> = {
  danger: 'bg-danger-tint text-danger',
  success: 'bg-success-tint text-success'
}

export function Alert({ tone = 'danger', children }: { tone?: Tone; children: ReactNode }) {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('type-body-sm flex items-start gap-2 rounded-md px-4 py-3', TONES[tone])}
    >
      <Icon aria-hidden className="mt-1 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
