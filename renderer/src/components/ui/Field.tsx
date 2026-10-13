import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

// Control outlines use border-strong (3:1 or better), as the design system requires.
const CONTROL =
  'type-body h-11 w-full rounded-sm border border-border-strong bg-bg px-3 text-ink ' +
  'placeholder:text-ink-muted transition-colors duration-[120ms] ease-brand ' +
  'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70 ' +
  'aria-[invalid=true]:border-danger'

interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  warning?: string
  children: ReactNode
}

function FieldShell({ id, label, hint, error, warning, children }: FieldShellProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="type-label block text-ink">
        {label}
      </label>
      {children}
      {warning && (
        // On its tint so the warning color keeps its contrast in both themes.
        <p role="status" className="type-caption w-fit rounded-sm bg-warning-tint px-2 text-warning">
          {warning}
        </p>
      )}
      {error ? (
        <p id={`${id}-message`} role="alert" className="type-caption text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-message`} className="type-caption text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  // A non-blocking notice, e.g. "Caps Lock is on".
  warning?: string
  // Rendered inside the field at its end edge (e.g. a show-password toggle).
  trailing?: ReactNode
}

export function TextField({
  label,
  hint,
  error,
  warning,
  trailing,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} warning={warning}>
      <div className="relative">
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-message` : undefined}
          className={cn(CONTROL, trailing ? 'pe-11' : undefined, className)}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 end-1 flex items-center">{trailing}</div>
        )}
      </div>
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export function SelectField({ label, hint, error, className, id, children, ...rest }: SelectFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-message` : undefined}
          className={cn(CONTROL, 'appearance-none pe-10', className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </FieldShell>
  )
}

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function CheckboxField({ label, className, id, ...rest }: CheckboxFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <label htmlFor={fieldId} className={cn('type-label flex items-center gap-2 text-ink', className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="size-5 rounded-sm border border-border-strong accent-primary"
        {...rest}
      />
      {label}
    </label>
  )
}
