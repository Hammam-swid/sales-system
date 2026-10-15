import { useCallback, useEffect, useState } from 'react'
import type { HeldSaleDto } from '../../../../shared/sales'
import { api, errorText } from '../../lib/api'
import { useCurrency } from '../../store/settings'

interface Options {
  onResumed: (held: HeldSaleDto) => void
  onClose: () => void
}

export function useHeldSalesModal({ onResumed, onClose }: Options) {
  const currency = useCurrency()
  const [held, setHeld] = useState<HeldSaleDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await api('sales:held')
    if (result.ok) setHeld(result.data)
    else setError(errorText(result))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resume = async (id: number) => {
    const result = await api('sales:resumeHeld', { id })
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    onResumed(result.data)
    onClose()
  }

  const discard = async (id: number) => {
    const result = await api('sales:discardHeld', { id })
    if (result.ok) void load()
    else setError(errorText(result))
  }

  return { currency, held, error, resume, discard }
}
