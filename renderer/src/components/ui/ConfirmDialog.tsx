import { useState } from 'react'
import { t } from '../../i18n/ar'
import { Alert } from './Alert'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  // Return an error message to keep the dialog open and show it; return nothing on success.
  onConfirm: () => Promise<string | void>
  onClose: () => void
}

// Confirmation for destructive actions.
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const message = await onConfirm()
    setBusy(false)
    if (message) setError(message)
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-6">
        {error && <Alert>{error}</Alert>}
        <p className="type-body text-ink">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" loading={busy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
