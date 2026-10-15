import { createPortal } from 'react-dom'
import { usePrintHost } from '../hooks/components/usePrintHost'
import { Receipt } from './Receipt'

// Mounted once in the app shell. When an invoice is queued for printing it renders the
// receipt outside the app root (which the print stylesheet hides) and opens the print dialog.
export function PrintHost() {
  const { sale } = usePrintHost()

  if (!sale) return null
  return createPortal(
    <div className="print-host">
      {/* Overrides the A4 default only while a receipt is being printed. */}
      <style>{'@page { size: 80mm auto; margin: 0; }'}</style>
      <Receipt sale={sale} />
    </div>,
    document.body
  )
}
