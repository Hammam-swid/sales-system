import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

// Flat surface with a hairline border; shadows are reserved for things that float.
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface', className)} {...rest} />
  )
}
