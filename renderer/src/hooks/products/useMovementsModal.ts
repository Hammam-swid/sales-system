import { useEffect, useState } from 'react'
import type { StockMovementDto } from '../../../../shared/catalog'
import { api, errorText } from '../../lib/api'

export function useMovementsModal(productId: number) {
  const [movements, setMovements] = useState<StockMovementDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api('products:movements', { productId }).then((result) => {
      if (result.ok) setMovements(result.data)
      else setError(errorText(result))
    })
  }, [productId])

  return { movements, error }
}
