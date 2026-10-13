import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { t } from '../../i18n/ar'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

// Built on the native <dialog>, which provides the focus trap, Escape handling and backdrop.
// Mount it to open, unmount it to close.
export function Modal({ title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto w-[min(480px,calc(100vw-32px))] rounded-lg border border-border bg-bg p-0 text-ink shadow-lg"
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="type-h4">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-[120ms] hover:bg-surface hover:text-ink"
        >
          <X aria-hidden className="size-5" />
        </button>
      </header>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
