import { useState, type FormEvent } from 'react'
import type { PartyDto } from '../../../../shared/parties'
import { errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import type { PartyKind } from '../../pages/parties/partyKinds'

interface Options {
  kind: PartyKind
  party: PartyDto
  onSaved: () => void
}

export function usePartyPaymentModal({ kind, party, onSaved }: Options) {
  const currency = useCurrency()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const value = parseNumber(amount)
  const exceeds = value !== null && value > party.balance

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (value === null || value <= 0 || exceeds) return
    setSaving(true)
    setError(null)
    const result = await kind.pay({
      id: party.id,
      amount: value,
      note: note.trim() === '' ? null : note.trim()
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return {
    currency,
    amount,
    setAmount,
    payAll: () => setAmount(String(party.balance)),
    note,
    setNote,
    exceeds,
    error,
    saving,
    submit
  }
}
