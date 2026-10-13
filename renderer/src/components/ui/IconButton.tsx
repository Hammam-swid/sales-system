import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  // Required: it is the button's only accessible name, and its tooltip.
  label: string
  tone?: 'default' | 'danger'
}

export function IconButton({ icon: Icon, label, tone = 'default', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors duration-[120ms] ease-brand hover:bg-bg',
        tone === 'danger' ? 'hover:text-danger' : 'hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-55',
        className
      )}
      {...rest}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  )
}
