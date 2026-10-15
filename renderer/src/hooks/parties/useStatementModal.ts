import { useCallback, useEffect, useState } from 'react'
import type { StatementDto } from '../../../../shared/parties'
import { t } from '../../i18n'
import { errorText } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import type { PartyKind } from '../../pages/parties/partyKinds'

interface Options {
  kind: PartyKind
  partyId: number
  // Called when a recalculation changes the stored balance.
  onChanged: () => void
}

// Full history for one customer or supplier, with a running balance, plus a check
// that the stored balance matches what the history adds up to.
export function useStatementModal({ kind, partyId, onChanged }: Options) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const [statement, setStatement] = useState<StatementDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)

  const load = useCallback(async () => {
    const result = await kind.statement(partyId)
    if (result.ok) setStatement(result.data)
    else setError(errorText(result))
  }, [kind, partyId])

  useEffect(() => {
    void load()
  }, [load])

  const recalculate = async () => {
    setFixing(true)
    const result = await kind.recalculate(partyId)
    setFixing(false)
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    setNotice(t.parties.recalculated)
    onChanged()
    void load()
  }

  const mismatch = statement ? statement.computedBalance !== statement.party.balance : false
  // Newest first on screen; the running balance was computed oldest first.
  const rows = statement ? [...statement.entries].reverse() : []

  return { money, statement, error, notice, fixing, recalculate, mismatch, rows }
}
