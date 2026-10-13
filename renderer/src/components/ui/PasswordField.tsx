import { useState, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { t } from '../../i18n/ar'
import { hasArabicLetters } from '../../lib/text'
import { TextField } from './Field'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
  error?: string
}

export function PasswordField({ onKeyDown, onKeyUp, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const Icon = visible ? EyeOff : Eye

  const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(event.getModifierState('CapsLock'))

  // Hidden characters make these two mistakes invisible, so say them out loud.
  // Arabic passwords are allowed; this is a notice, not an error.
  const warning = capsLock
    ? t.keyboard.capsLock
    : typeof props.value === 'string' && hasArabicLetters(props.value)
      ? t.keyboard.arabicLayout
      : undefined

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      dir="ltr"
      className="text-start"
      warning={warning}
      onKeyDown={(event) => {
        trackCapsLock(event)
        onKeyDown?.(event)
      }}
      onKeyUp={(event) => {
        trackCapsLock(event)
        onKeyUp?.(event)
      }}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t.login.hidePassword : t.login.showPassword}
          aria-pressed={visible}
          className="flex size-9 items-center justify-center rounded-sm text-ink-muted hover:text-ink"
        >
          <Icon aria-hidden className="size-5" />
        </button>
      }
    />
  )
}
