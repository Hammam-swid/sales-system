import { useCallback, useEffect, useRef, useState } from 'react'
import type { PartyDto } from '../../../../shared/parties'
import { t } from '../../i18n'
import { errorText } from '../../lib/api'
import { useCurrency } from '../../store/settings'
import type { PartyKind } from '../../pages/parties/partyKinds'

const SEARCH_DEBOUNCE_MS = 250

export type PartiesDialog =
  | { kind: 'create' }
  | { kind: 'edit'; party: PartyDto }
  | { kind: 'pay'; party: PartyDto }
  | { kind: 'statement'; party: PartyDto }
  | { kind: 'delete'; party: PartyDto }
  | null

// One screen for both customers and suppliers.
export function usePartiesPage(kind: PartyKind, canManage: boolean) {
  const currency = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [parties, setParties] = useState<PartyDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<PartiesDialog>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (search: string) => {
      const current = ++requestId.current
      const result = await kind.list(search)
      if (current !== requestId.current) return
      if (result.ok) {
        setParties(result.data)
        setError(null)
      } else {
        setError(errorText(result))
      }
    },
    [kind]
  )

  useEffect(() => {
    const timer = setTimeout(() => void load(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, load])

  const refresh = () => void load(searchInput.trim())

  const finish = (message: string) => {
    setDialog(null)
    setNotice(message)
    refresh()
  }

  const removeParty = async (party: PartyDto) => {
    const result = await kind.remove(party.id)
    if (!result.ok) return errorText(result)
    finish(t.parties.deleted)
  }

  const totalBalance = (parties ?? []).reduce((sum, party) => sum + party.balance, 0)
  const columnCount = canManage ? 5 : 4

  return {
    currency,
    searchInput,
    setSearchInput,
    parties,
    error,
    notice,
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    refresh,
    finish,
    removeParty,
    totalBalance,
    columnCount
  }
}
