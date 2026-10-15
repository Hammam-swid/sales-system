import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { usePrintStore } from '../../store/print'

// When an invoice is queued for printing, opens the print dialog once the receipt
// has painted, and clears the queue when printing ends.
export function usePrintHost() {
  const sale = usePrintStore((state) => state.sale)
  const done = usePrintStore((state) => state.done)
  const signedIn = useAuthStore((state) => state.user !== null)

  useEffect(() => {
    if (!sale) return
    // Tells the print stylesheet this is a receipt, not a report.
    document.body.classList.add('printing-receipt')
    window.addEventListener('afterprint', done, { once: true })
    // Let the receipt paint before the dialog opens.
    const timer = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', done)
      document.body.classList.remove('printing-receipt')
    }
  }, [sale, done])

  return { sale: signedIn ? sale : null }
}
